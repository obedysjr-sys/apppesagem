import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface EmailRequest {
  to: string[];
  cc?: string[];  // Opcional - Cópia
  subject: string;
  html: string;
  pdfBase64?: string;  // Opcional
  pdfFileName?: string; // Opcional
}

// Headers CORS
const getCorsHeaders = (origin: string | null) => {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ];

  const allowedEnv = (typeof Deno !== 'undefined' ? Deno.env.get('ALLOWED_ORIGINS') : undefined) || '';
  const allowedFromEnv = allowedEnv.split(',').map(s => s.trim()).filter(Boolean);

  const isVercel = origin ? /\.vercel\.app$/i.test(origin) : false;
  const isAllowed = Boolean(
    origin && (
      defaultOrigins.includes(origin) ||
      allowedFromEnv.includes(origin) ||
      isVercel
    )
  );

  return {
    'Access-Control-Allow-Origin': origin && isAllowed ? origin : (origin ?? defaultOrigins[0]),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Resposta imediata para requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Recebendo requisição...');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Body recebido:', { 
        to: requestBody.to, 
        subject: requestBody.subject,
        hasPdf: !!requestBody.pdfBase64,
        pdfSize: requestBody.pdfBase64?.length || 0
      });
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar JSON da requisição', details: String(parseError) }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { to, cc, subject, html, pdfBase64, pdfFileName }: EmailRequest = requestBody;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lista de emails é obrigatória' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = to.filter(email => emailRegex.test(email));
    
    // Validar emails de cópia (cc) se fornecidos
    let validCcEmails: string[] = [];
    if (cc && Array.isArray(cc) && cc.length > 0) {
      validCcEmails = cc.filter(email => emailRegex.test(email));
      console.log('Emails CC válidos:', validCcEmails);
    }
    
    if (validEmails.length === 0 && validCcEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum email válido fornecido (to ou cc)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Emails TO válidos:', validEmails);

    // Configuração do Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@resend.dev';
    
    console.log('Resend config:', { 
      hasApiKey: !!RESEND_API_KEY,
      apiKeyPrefix: RESEND_API_KEY?.substring(0, 5) || 'N/A',
      fromEmail: RESEND_FROM_EMAIL
    });
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY não encontrada');
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY não configurada. Configure a variável de ambiente no Supabase.',
          hint: 'Vá em Edge Functions > Secrets e adicione RESEND_API_KEY'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Preparando payload do email...');
    
    // Criar payload para Resend API
    const emailPayload: any = {
      from: RESEND_FROM_EMAIL,
      to: validEmails,
      subject: subject || 'Relatório de Recebimento',
      html: html || '<p>Relatório em anexo.</p>',
    };

    // Adicionar CC se houver emails válidos
    if (validCcEmails.length > 0) {
      emailPayload.cc = validCcEmails;
      console.log('CC adicionado ao payload:', validCcEmails.length, 'emails');
    }

    // Adicionar anexo apenas se PDF foi fornecido
    if (pdfBase64 && pdfFileName) {
      // Preparar anexo para Resend
      // Remover prefixo data:application/pdf;base64, se existir
      let pdfBase64Data = pdfBase64;
      if (typeof pdfBase64Data === 'string' && pdfBase64Data.includes(',')) {
        pdfBase64Data = pdfBase64Data.split(',')[1];
      }
      
      emailPayload.attachments = [
        {
          filename: pdfFileName,
          content: pdfBase64Data,
        }
      ];
      console.log('Anexo PDF adicionado:', pdfFileName);
    }

    console.log('Enviando para Resend API...');
    console.log('Payload:', JSON.stringify({ 
      from: emailPayload.from, 
      to: emailPayload.to, 
      subject: emailPayload.subject,
      hasAttachments: !!emailPayload.attachments 
    }));
    
    // Enviar email via Resend API
    let resendResponse;
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });
      console.log('Resposta do Resend:', resendResponse.status, resendResponse.statusText);
    } catch (fetchError: any) {
      console.error('Erro ao fazer fetch para Resend API:', fetchError);
      console.error('Tipo do erro:', fetchError.name);
      console.error('Mensagem:', fetchError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Erro de conexão com Resend API',
          details: fetchError.message || String(fetchError),
          hint: 'Verifique se a RESEND_API_KEY está correta e se há conectividade com api.resend.com',
          errorType: fetchError.name || 'UnknownError'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('Resend API Error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao enviar email via Resend: ${errorData.message || errorText}`,
          details: errorData,
          status: resendResponse.status
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const resendData = await resendResponse.json();
    console.log('Email enviado com sucesso:', resendData.id);
    
    const totalRecipients = validEmails.length + validCcEmails.length;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado com sucesso para ${totalRecipients} destinatário(s) (${validEmails.length} TO + ${validCcEmails.length} CC)`,
        recipients: validEmails,
        ccRecipients: validCcEmails,
        resendId: resendData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        details: String(error),
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


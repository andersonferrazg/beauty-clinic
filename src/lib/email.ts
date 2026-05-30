type EmailParams = {
  para: string;
  assunto: string;
  html: string;
};

export async function enviarEmail({ para, assunto, html }: EmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY não configurada — e-mail não enviado.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Beauty Clinic <noreply@beautyapp.com.br>",
      to: [para],
      subject: assunto,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[email] Falha ao enviar:", res.status, err);
  }
}

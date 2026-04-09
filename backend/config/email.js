const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResultatEmail = async (to, etudiant, soutenance, jurys) => {
  const juryRows = jurys.map(j => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${j.role}</td>
      <td style="padding:8px;border:1px solid #ddd;">${j.prenom} ${j.nom}</td>
      <td style="padding:8px;border:1px solid #ddd;">${j.remarques ?? '—'}</td>
    </tr>`).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `GradFlow — Résultats de votre soutenance`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <div style="background:#2d1b69;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🎓 GradFlow</h1>
          <p style="color:#c4b5fd;margin:5px 0 0;">Résultats de soutenance</p>
        </div>
        <div style="background:#f8f7ff;padding:24px;border-radius:0 0 8px 8px;">
          <p>Bonjour <strong>${etudiant.prenom} ${etudiant.nom}</strong>,</p>
          <p>Votre soutenance sur le sujet <strong>"${soutenance.sujet}"</strong> est terminée.</p>
         <div style="background:#2d1b69;color:#fff;padding:14px 20px;border-radius:8px;margin:16px 0;font-size:18px;text-align:center;">
  Note finale : <strong>${soutenance.note_finale ?? 'En cours'}/20</strong>
  ${soutenance.note_finale != null ? `
  <div style="margin-top:8px;font-size:15px;color:#c4b5fd;">
    Mention : <strong style="color:#fff;">
      ${soutenance.note_finale >= 16 ? 'Très bien' :
        soutenance.note_finale >= 14 ? 'Bien' :
        soutenance.note_finale >= 12 ? 'Assez bien' :
        soutenance.note_finale >= 10 ? 'Passable' :
        'Insuffisant'}
    </strong>
  </div>` : ''}
</div>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#2d1b69;color:#fff;">
                <th style="padding:8px;text-align:left;">Rôle</th>
                <th style="padding:8px;text-align:left;">Jury</th>
                <th style="padding:8px;text-align:left;">Remarques</th>
              </tr>
            </thead>
            <tbody>${juryRows}</tbody>
          </table>
          <p style="margin-top:24px;color:#6b7280;font-size:12px;">Département Informatique — GradFlow</p>
        </div>
      </div>`
  });
};
module.exports = { 
  sendResultatEmail,
  transporter  // Ajoutez cette ligne
};
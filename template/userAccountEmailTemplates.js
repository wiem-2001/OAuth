const singUpConfirmationEmailTemplate = (
    fullName,
    API_ENDPOINT,
    email,
    confirmationCode,
  ) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de votre inscription</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8f9fa;
      }
      .container {
        background-color: #white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1, p {
        margin: 0;
      }
      a {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background-color:black;
        color:white;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Bonjour ${fullName},</h1>
      <p>

Merci de vous être inscrit(e) sur notre site.</p>
 <p>Pour compléter votre inscription, veuillez activer votre compte en cliquant sur le lien ci-dessous : </p>
 <a href="${API_ENDPOINT}/account/${confirmationCode}/enable">Activer mon compte</a>
      <p>Si vous n'avez pas créé de compte chez nous, veuillez ignorer cet email.</p>
      <p>Cordialement.</p>
    </div>
  </body>
  </html>
  
  `;
  
  const forgotPasswordEmailTemplate = (fullName, email, API_ENDPOINT, token) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8f9fa;
      }
      .container {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1, p {
        margin: 0;
      }
      a {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Bonjour ${fullName},</h1>
      <p>Vous avez récemment fait une demande de réinitialisation du mot de passe de votre compte : ${email}</p>
      <p>Cliquez sur le lien ci-dessous pour commencer le processus de réinitialisation.</p>
      <a href="${API_ENDPOINT}/auth/reset-password/${token}">Réinitialisation de mot de passe</a>
      <p>Cordialement.</p>
    </div>
  </body>
  </html>
  
  `;
  
  const resetPasswordConfirmationEmailTemplate = (fullName) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de réinitialisation du mot de passe</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8f9fa;
      }
      .container {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1, p {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Bonjour ${fullName},</h1>
      <p>Votre mot de passe a été réinitialisé avec succès.</p>
      <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
      <p>Cordialement.</p>
    </div>
  </body>
  </html>
  
  `;
  
  // export module
  module.exports = {
    singUpConfirmationEmailTemplate,
    forgotPasswordEmailTemplate,
    resetPasswordConfirmationEmailTemplate,
  };
  
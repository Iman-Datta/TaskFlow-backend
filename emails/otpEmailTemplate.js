const otpEmailTemplate = (otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Your TaskFlow verification code</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Georgia', serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 48px 16px;">
      <tr>
        <td align="center">

          <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background-color:#18181b; padding: 28px 40px;">
                <p style="margin:0; font-family:'Georgia', serif; font-size:20px; color:#ffffff; letter-spacing:0.04em;">
                  TaskFlow
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px 40px 32px;">

                <h1 style="margin:0 0 16px; font-family:'Georgia', serif; font-size:22px; font-weight:normal; color:#18181b; letter-spacing:-0.01em;">
                  Your verification code
                </h1>

                <p style="margin:0 0 28px; font-family:Arial, sans-serif; font-size:15px; line-height:1.6; color:#52525b;">
                  Use the code below to verify your identity. It is valid for
                  <strong style="color:#18181b;">10 minutes</strong> and can only be used once.
                </p>

                <!-- OTP Box -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr>
                    <td style="background-color:#f4f4f5; border-radius:8px; border:1px solid #e4e4e7; padding: 20px 36px;">
                      <p style="margin:0; font-family:'Courier New', monospace; font-size:32px; font-weight:700; color:#18181b; letter-spacing:0.25em; text-align:center;">
                        ${otp}
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:Arial, sans-serif; font-size:15px; line-height:1.6; color:#52525b;">
                  If you did not request this, you can safely ignore this email.
                  No action is required.
                </p>

              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 40px;">
                <hr style="border:none; border-top:1px solid #e4e4e7; margin:0;" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px 32px;">

                <p style="margin:0 0 8px; font-family:Arial, sans-serif; font-size:12px; color:#a1a1aa; line-height:1.6;">
                  This email was sent because a verification was requested for your TaskFlow account.
                  If this was not you, no action is required.
                </p>

                <p style="margin:12px 0 12px; font-family:Arial, sans-serif; font-size:12px; color:#a1a1aa;">
                  TaskFlow — Built by Iman Datta
                </p>

                <!-- Links -->
                <table cellpadding="0" cellspacing="0" style="margin-top:10px;">
                  <tr>

                    <td style="padding-right:16px;">
                      <a href="https://github.com/Iman-Datta" style="text-decoration:none; color:#18181b; font-family:Arial, sans-serif; font-size:12px;">
                        GitHub Profile
                      </a>
                    </td>

                    <td style="padding-right:16px;">
                      <a href="https://github.com/Iman-Datta/TaskFlow.git" style="text-decoration:none; color:#18181b; font-family:Arial, sans-serif; font-size:12px;">
                        Frontend Repository
                      </a>
                    </td>

                    <td style="padding-right:16px;">
                      <a href="https://github.com/Iman-Datta/TaskFlow-backend.git" style="text-decoration:none; color:#18181b; font-family:Arial, sans-serif; font-size:12px;">
                        Backend Repository
                      </a>
                    </td>

                    <td>
                      <a href="https://www.linkedin.com/in/iman-datta-161615307/" style="text-decoration:none; color:#18181b; font-family:Arial, sans-serif; font-size:12px;">
                        LinkedIn
                      </a>
                    </td>

                  </tr>
                </table>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};

module.exports = otpEmailTemplate;

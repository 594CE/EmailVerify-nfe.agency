import net from "net";
import { logger } from "@nfe/config";

export class SMTPVerifier {
  public static async verify(
    email: string,
    mxHost: string,
  ): Promise<{ status: string; isCatchAll: boolean }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);

      let step = 0;
      let status = "unknown";
      let isCatchAll = false;

      const [local, domain] = email.split("@");
      const senderDomain = process.env.SENDER_DOMAIN || "example.com";

      socket.on("data", (data) => {
        const response = data.toString();

        if (response.startsWith("220") && step === 0) {
          socket.write(`EHLO ${senderDomain}\r\n`);
          step = 1;
        } else if (response.startsWith("250") && step === 1) {
          socket.write(`MAIL FROM:<verify@${senderDomain}>\r\n`);
          step = 2;
        } else if (response.startsWith("250") && step === 2) {
          socket.write(`RCPT TO:<${email}>\r\n`);
          step = 3;
        } else if (step === 3) {
          if (response.startsWith("250")) {
            status = "valid";

            // To detect Catch-All, we can issue a random RCPT TO
            const randomUser = Math.random().toString(36).substring(7);
            socket.write(`RCPT TO:<${randomUser}@${domain}>\r\n`);
            step = 4;
          } else if (
            response.startsWith("451") ||
            response.startsWith("452") ||
            response.startsWith("421")
          ) {
            status = "risky"; // Greylisted or Temp fail
            socket.write("QUIT\r\n");
          } else {
            status = "invalid";
            socket.write("QUIT\r\n");
          }
        } else if (step === 4) {
          if (response.startsWith("250")) {
            isCatchAll = true;
          }
          socket.write("QUIT\r\n");
        }
      });

      socket.on("error", (err) => {
        logger.warn({ err, email }, "SMTP connection error");
        resolve({ status: "unknown", isCatchAll });
        socket.destroy();
      });

      socket.on("timeout", () => {
        resolve({ status: "unknown", isCatchAll });
        socket.destroy();
      });

      socket.on("close", () => {
        resolve({ status, isCatchAll });
      });

      socket.connect(25, mxHost);
    });
  }
}

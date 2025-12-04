"use client";

import * as React from "react";
import { QrCode, Download, Printer, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface PropertyCheckInQRProps {
  propertyId: string;
  propertyName: string;
  hostAddress: string;
}

export function PropertyCheckInQR({
  propertyId,
  propertyName,
  hostAddress,
}: PropertyCheckInQRProps) {
  const [copied, setCopied] = React.useState(false);

  // Generate QR code data
  const qrData = JSON.stringify({
    type: "nomadnodes-checkin",
    propertyId,
    hostAddress,
    version: "1.0",
  });

  const handleDownload = () => {
    const svg = document.getElementById("checkin-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${propertyName}-checkin-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    if (!printWindow) return;

    const svg = document.getElementById("checkin-qr-code");
    if (!svg) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Check-in QR Code - ${propertyName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #000;
              padding: 40px;
              border-radius: 12px;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            h2 {
              font-size: 20px;
              color: #666;
              margin-bottom: 30px;
            }
            .qr-container {
              margin: 20px 0;
            }
            p {
              font-size: 16px;
              color: #333;
              margin: 10px 0;
            }
            .instructions {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏠 ${propertyName}</h1>
            <h2>Self Check-In</h2>
            <div class="qr-container">
              ${svg.outerHTML}
            </div>
            <div class="instructions">
              <p><strong>How to check in:</strong></p>
              <p>1. Open the NomadNodes app</p>
              <p>2. Scan this QR code</p>
              <p>3. Confirm your arrival</p>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Property ID: ${propertyId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCopyLink = () => {
    const link = `https://nomadnodes.app/checkin?data=${encodeURIComponent(qrData)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Check-in link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Self Check-In QR Code
        </CardTitle>
        <CardDescription>
          Display this QR code at your property for guests to confirm their arrival
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-6">
          <QRCodeSVG id="checkin-qr-code" value={qrData} size={256} level="H" includeMargin />
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Guests scan this code to confirm check-in
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleDownload} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint} variant="outline" className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        <Button onClick={handleCopyLink} variant="secondary" className="w-full">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Check-in Link
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium">Where to display this QR code:</h4>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">•</span>
              <span>Print and frame it at the entrance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">•</span>
              <span>Include it in your lockbox with the keys</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">•</span>
              <span>Send the link in your welcome message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">•</span>
              <span>Display on a tablet at the property</span>
            </li>
          </ul>
        </div>

        {/* How it works */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium">How it works:</h4>
          <ol className="text-muted-foreground space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">1.</span>
              <span>Guest arrives at your property</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">2.</span>
              <span>They scan this QR code with their phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">3.</span>
              <span>App automatically finds their booking for this property</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">4.</span>
              <span>Guest confirms arrival (available 24h after check-in time)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-semibold">5.</span>
              <span>Payment is released to you immediately</span>
            </li>
          </ol>
        </div>

        {/* Backup info */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground text-xs">
            <strong>Backup:</strong> If guest doesn't confirm within 48h of check-in, you can
            manually release the payment from your dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

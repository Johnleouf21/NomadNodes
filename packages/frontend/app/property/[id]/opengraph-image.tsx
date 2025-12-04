import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Property on NomadNodes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const propertyId = params.id;

  // TODO: Fetch property data from blockchain/indexer
  // For now, using placeholder data

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          NomadNodes
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: "normal",
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          Property #{propertyId}
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 30,
            opacity: 0.9,
          }}
        >
          Decentralized Vacation Rentals
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

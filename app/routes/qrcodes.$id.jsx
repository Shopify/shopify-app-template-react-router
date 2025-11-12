import invariant from "tiny-invariant";
import { useLoaderData } from "react-router";

import db from "../db.server";
import { getQRCodeImage } from "../models/QRCode.server";

export const loader = async ({ params }) => {
  invariant(params.id, "Could not find QR code destination");

  const id = Number(params.id);
  const qrCode = await db.qRCode.findFirst({ where: { id } });

  invariant(qrCode, "Could not find QR code destination");

  return {
    title: qrCode.title,
    image: await getQRCodeImage(id),
  };
};

export default function QRCode() {
  const { image, title } = useLoaderData();

  return (
    <>
      <h1>{title}</h1>
      <img src={image} alt={`QR Code for product`} />
    </>
  );
}


import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getQRCodes } from "../models/QRCode.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const qrCodes = await getQRCodes(session.shop, admin.graphql);

  return {
    qrCodes,
  };
}

const EmptyQRCodeState = () => (
  <s-section accessibilityLabel="Empty state section">
    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
      <s-box maxInlineSize="200px" maxBlockSize="200px">
        <s-image
          aspectRatio="1/0.5"
          src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          alt="A stylized graphic of a document"
        />
      </s-box>
      <s-grid justifyItems="center" maxBlockSize="450px" maxInlineSize="450px">
        <s-heading>Create unique QR codes for your products</s-heading>
        <s-paragraph>
          Allow customers to scan codes and buy products using their phones.
        </s-paragraph>
        <s-stack
          gap="small-200"
          justifyContent="center"
          padding="base"
          paddingBlockEnd="none"
          direction="inline"
        >
          <s-button href="/app/qrcodes/new" variant="primary">
            Create QR code
          </s-button>
        </s-stack>
      </s-grid>
    </s-grid>
  </s-section>
);

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

const QRTable = ({ qrCodes }) => (
  <s-section padding="none" accessibilityLabel="QRCode table">
    <s-table>
      <s-table-header-row>
        <s-table-header listSlot="primary">Title</s-table-header>
        <s-table-header>Product</s-table-header>
        <s-table-header>Date created</s-table-header>
        <s-table-header>Scans</s-table-header>
      </s-table-header-row>
      <s-table-body>
        {qrCodes.map((qrCode) => (
          <QRTableRow key={qrCode.id} qrCode={qrCode} />
        ))}
      </s-table-body>
    </s-table>
  </s-section>
);

const QRTableRow = ({ qrCode }) => (
  <s-table-row id={qrCode.id} position={qrCode.id}>
    <s-table-cell>
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-clickable
          href={`/app/qrcodes/${qrCode.id}`}
          accessibilityLabel={`Go to the product page for ${qrCode.productTitle}`}
          border="base"
          borderRadius="base"
          overflow="hidden"
          inlineSize="20px"
          blockSize="20px"
        >
          {qrCode.productImage ? (
            <s-image objectFit="cover" src={qrCode.productImage}></s-image>
          ) : (
            <s-icon size="large" type="image" />
          )}
        </s-clickable>
        <s-link href={`/app/qrcodes/${qrCode.id}`}>
          {truncate(qrCode.title)}
        </s-link>
      </s-stack>
    </s-table-cell>
    <s-table-cell>
      {qrCode.productDeleted ? (
        <s-badge icon="alert-diamond" tone="critical">
          Product has been deleted
        </s-badge>
      ) : (
        truncate(qrCode.productTitle)
      )}
    </s-table-cell>
    <s-table-cell>{new Date(qrCode.createdAt).toDateString()}</s-table-cell>
    <s-table-cell>{qrCode.scans}</s-table-cell>
  </s-table-row>
);

export default function Index() {
  const { qrCodes } = useLoaderData();

  return (
    <s-page heading="QR codes">
      <s-link slot="secondary-actions" href="/app/qrcodes/new">
        Create QR code
      </s-link>
      {qrCodes.length === 0 ? (
        <EmptyQRCodeState />
      ) : (
        <QRTable qrCodes={qrCodes} />
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

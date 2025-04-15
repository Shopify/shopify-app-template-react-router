import {
  BlockStack,
  reactExtension,
  TextBlock,
  Banner,
  useApi
} from "@shopify/ui-extensions-react/customer-account";
import {useEffect} from "react"

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <PromotionBanner />
);

function PromotionBanner() {
  const { i18n, sessionToken } = useApi();

  console.log("render")

  useEffect(() => {

    console.log("useEffect")

    const fetchData = async () => {

      console.log("fetchData")

      try {
        const token = await sessionToken.get();
        const response = await fetch(`${TUNNEL_URL}/api/customer-account/extension`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log('Fetched data:', data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <Banner>
      <BlockStack inlineAlignment="center">
        <TextBlock>{i18n.translate("earnPoints")}</TextBlock>
      </BlockStack>
    </Banner>
  );
}

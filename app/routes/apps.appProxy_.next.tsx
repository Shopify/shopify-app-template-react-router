import { authenticate } from "../shopify.server";
import { useLoaderData, useActionData, Form } from "react-router";
import { useState } from "react";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.public.appProxy(request);
  
  // Get the shop domain from the request
  const url = new URL(request.url);
  const shopDomain = url.hostname;
  
  return { 
    appUrl: process.env.SHOPIFY_APP_URL || "",
    shop: session?.shop || "Unknown Shop",
    shopDomain
  };
}

export async function action({ request }: { request: Request }) {
  const { session } = await authenticate.public.appProxy(request);
  
  const formData = await request.formData();
  const product = formData.get("product") as string;
  const quantity = formData.get("quantity") as string;
  
  // Process the data (e.g., save to database, call APIs, etc.)
  console.log("Order submitted:", { 
    shop: session?.shop,
    product, 
    quantity 
  });
  
  return { 
    success: true, 
    order: { product, quantity },
    message: "Order processed successfully!" 
  };
}

export default function AppProxyNext() {
  const { appUrl, shop, shopDomain } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showDetails, setShowDetails] = useState(false);
  
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    // Navigate using the current shop domain
    window.location.href = `${window.location.origin}${path}`;
  };
  
  return (
    <>
      {/* This base tag enables loading JS and CSS from your app URL */}
      <base href={appUrl} />
      
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: '#333' }}>React Router App Proxy Example</h1>
        
        <div style={{ 
          background: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px' 
        }}>
          <p><strong>Shop:</strong> {shop}</p>
          <p><strong>Shop Domain:</strong> {shopDomain}</p>
          <p><strong>App URL:</strong> {appUrl}</p>
          <p><strong>Current Route:</strong> /apps/appProxy/next</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>Interactive Elements</h2>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: '#008060',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          {showDetails && (
            <div style={{ 
              marginTop: '15px', 
              padding: '15px', 
              background: '#e3f4f4',
              borderRadius: '4px' 
            }}>
              <h3>Additional Information</h3>
              <p>This is a React component rendered via React Router.</p>
              <p>Unlike Liquid templates, this uses client-side JavaScript and React state.</p>
            </div>
          )}
        </div>

        <hr style={{ margin: '30px 0' }} />

        <h2>Product Order Form</h2>
        <Form method="POST" style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="product" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product Name:
            </label>
            <input 
              type="text" 
              id="product" 
              name="product" 
              required 
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="quantity" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Quantity:
            </label>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1"
              required 
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            />
          </div>
          
          <button 
            type="submit"
            style={{
              background: '#5c6ac4',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Submit Order
          </button>
        </Form>
        
        {actionData?.success && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724'
          }}>
            <h3>{actionData.message}</h3>
            <p><strong>Product:</strong> {actionData.order.product}</p>
            <p><strong>Quantity:</strong> {actionData.order.quantity}</p>
          </div>
        )}

        <hr style={{ margin: '30px 0' }} />
        
        <div style={{ textAlign: 'center' }}>
          <a 
            href="/apps/appProxy/"
            onClick={(e) => handleNavigate(e, '/apps/appProxy/')}
            style={{ 
              background: '#008060',
              color: 'white',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block',
              marginRight: '20px',
              cursor: 'pointer'
            }}
          >
            ← Back to React Example
          </a>
          <a 
            href={`https://${shop}`} 
            style={{ 
              color: '#5c6ac4',
              textDecoration: 'none' 
            }}
          >
            Back to Store →
          </a>
        </div>
      </div>
    </>
  );
} 
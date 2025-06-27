import { authenticate } from "../shopify.server";
import { useLoaderData, useActionData } from "react-router";
import { useState, useEffect } from "react";

export async function loader({ request }: { request: Request }) {
  await authenticate.public.appProxy(request);
  
  // Get the shop domain from the request
  const url = new URL(request.url);
  const shopDomain = url.hostname;

  return { 
    appUrl: process.env.SHOPIFY_APP_URL || "",
    shopDomain 
  };
}

export async function action({ request }: { request: Request }) {
  await authenticate.public.appProxy(request);
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  
  // Process the form data here (e.g., save to database, send email, etc.)
  console.log("Form submitted:", { name, email });
  
  return { 
    success: true, 
    data: { name, email },
    message: "Form submitted successfully!" 
  };
}

export default function App() {
  const { appUrl, shopDomain } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [count, setCount] = useState(0);
  const [requestUrl, setRequestUrl] = useState<URL | undefined>();

  useEffect(() => {
    setRequestUrl(new URL(window.location.href));
  }, []);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    // Navigate using the current shop domain
    window.location.href = `${window.location.origin}${path}`;
  };

  return (
    <>
      {/* This base tag enables loading JS and CSS from your app URL */}
      <base href={appUrl} />
      
      <div>
        <h1>React App Proxy Example</h1>
        <p><strong>Shop Domain:</strong> {shopDomain}</p>
        
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>Click me</button>
        <div>App URL: {appUrl}</div>
        {requestUrl && <div>Request URL: {requestUrl.href}</div>}
        
        <hr style={{ margin: '20px 0' }} />
        
        <h2>HTML Form Example</h2>
        <form method="POST">
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          
          <button type="submit">Submit Form</button>
        </form>
        
        {actionData?.success && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb' }}>
            <h3>{actionData.message}</h3>
            <p>Name: {actionData.data.name}</p>
            <p>Email: {actionData.data.email}</p>
          </div>
        )}
        
        <hr style={{ margin: '20px 0' }} />
        
        <div style={{ textAlign: 'center' }}>
          <a 
            href="/apps/appProxy/next/"
            onClick={(e) => handleNavigate(e, '/apps/appProxy/next/')}
            style={{ 
              background: '#5c6ac4', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '4px',
              display: 'inline-block',
              cursor: 'pointer'
            }}
          >
            Go to React Router Example →
          </a>
        </div>
      </div>
    </>
  );
}
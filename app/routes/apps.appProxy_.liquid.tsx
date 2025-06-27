import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  const { liquid } = await authenticate.public.appProxy(request);

  return liquid(`
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to {{shop.name}}'s App Proxy</h1>
      
      <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <p><strong>Shop Domain:</strong> {{shop.domain}}</p>
        <p><strong>App URL:</strong> ${process.env.SHOPIFY_APP_URL || ""}</p>
      </div>

      <hr style="margin: 30px 0;">
      
      <h2>Contact Form</h2>
      
      {% if form.posted_successfully? %}
        <div style="margin: 20px 0; padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
          <strong>Success!</strong> Your form has been submitted.
        </div>
      {% endif %}
      
      <form method="POST" action="/apps/appProxy/liquid" style="margin-top: 20px;">
        <div style="margin-bottom: 15px;">
          <label for="name" style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
          <input type="text" id="name" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="email" style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
          <input type="email" id="email" name="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="message" style="display: block; margin-bottom: 5px; font-weight: bold;">Message:</label>
          <textarea id="message" name="message" rows="4" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
        </div>
        
        <button type="submit" style="background: #5c6ac4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
          Submit Form
        </button>
      </form>

      <hr style="margin: 30px 0;">
      
      <h3>Interactive Counter (JavaScript)</h3>
      <p>You clicked <span id="counter">0</span> times</p>
      <button onclick="incrementCounter()" style="background: #008060; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
        Click me
      </button>
      
      <script>
        let count = 0;
        function incrementCounter() {
          count++;
          document.getElementById('counter').textContent = count;
        }
      </script>

      <hr style="margin: 30px 0;">
      
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="/apps/appProxy/" style="background: #008060; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
          React Example →
        </a>
        <a href="/apps/appProxy/next/" style="background: #5c6ac4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          React Router Example →
        </a>
      </div>
      
      <p style="text-align: center; color: #666;">
        Powered by Shopify App Proxy | 
        <a href="{{shop.url}}" style="color: #5c6ac4;">Back to Store</a>
      </p>
    </div>
  `);
}

export async function action({ request }: { request: Request }) {
  const { liquid, session } = await authenticate.public.appProxy(request);
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  
  // Process the form data here (e.g., save to database, send email, etc.)
  console.log("Form submitted:", { 
    shop: session?.shop,
    name, 
    email, 
    message 
  });
  
  // Return success page with Liquid
  return liquid(`
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h1>Form Submitted Successfully!</h1>
      
      <div style="margin: 20px 0; padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724;">
        <h2>Thank you for your submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p style="margin-top: 15px;"><em>Submitted to: {{shop.name}}</em></p>
      </div>
      
      <div style="margin-top: 30px;">
        <a href="/apps/appProxy/liquid" style="background: #5c6ac4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Submit Another Form
        </a>
      </div>
      
      <hr style="margin: 30px 0;">
      
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="/apps/appProxy/" style="background: #008060; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
          React Example →
        </a>
        <a href="/apps/appProxy/next/" style="background: #5c6ac4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          React Router Example →
        </a>
      </div>
      
      <p style="text-align: center; color: #666;">
        <a href="{{shop.url}}" style="color: #5c6ac4;">Back to Store</a>
      </p>
    </div>
  `, { layout: false });  // Using layout: false to show just our content
}
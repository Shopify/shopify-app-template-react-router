import type { Config } from "@react-router/dev/config";

declare module "react-router" {
  interface Future {
    unstable_middleware: true; // 👈 Enable middleware types
  }
}

export default {
  ssr: true,
  future: {
    unstable_middleware: true,
  },
} satisfies Config;
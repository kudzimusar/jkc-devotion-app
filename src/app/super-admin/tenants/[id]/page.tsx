import TenantDetailsView from "./tenant-details-view";

export const metadata = {
  title: "Church Management | Church OS Admin",
  description: "Granular control over church configuration, users, and AI strategy."
};

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // We return a placeholder to ensure the build generates a generic shell.
  // Real tenant IDs are resolved dynamically on the client at runtime.
  return [{ id: 'placeholder' }];
}

export default function TenantDetailsPage() {
  return <TenantDetailsView />;
}

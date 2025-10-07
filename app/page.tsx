import { Navigation } from "@/components/navigation";
import { JsonViewer } from "@/components/json-viewer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <JsonViewer />
      </main>
    </>
  );
}

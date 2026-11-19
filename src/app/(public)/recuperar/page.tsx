import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar mi formulario" };

export default async function RecoverPage(props: PageProps<"/recuperar">) {
  const sp = await props.searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <RecoverForm expired={sp.sesion === "expirada"} />
    </div>
  );
}

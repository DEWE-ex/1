import Link from "next/link";

export default function Header() {
  return (
    <header className="mb-8 text-center">
      <Link href="/" className="inline-block">
        <h1 className="text-4xl font-bold tracking-tight text-karuta-red md:text-5xl">
          かるた Karuta
        </h1>
        <p className="mt-1 text-sm text-karuta-wood/80">1 vs 1 Online</p>
      </Link>
    </header>
  );
}

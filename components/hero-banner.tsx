import Image from 'next/image'
import { HeroMeshGradient } from '@/components/hero-mesh-gradient'

export function HeroBanner() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative z-10 flex flex-col gap-5 py-10 px-6 sm:py-12 sm:pl-8 lg:w-3/5 lg:pl-12">
          <p className="text-4xl font-main tracking-tight text-indigo-600 sm:text-5xl lg:text-6xl">
            COOL,
          </p>
          <h1 className="max-w-xl text-xl font-main uppercase leading-tight tracking-tight text-foreground lg:text-2xl">
            Interesting and bigger domain name servers
          </h1>
        </div>

        <Image
          src="/emoji-cool@2x.png"
          alt=""
          aria-hidden="true"
          width={500}
          height={500}
          priority
          className="pointer-events-none absolute right-[-8%] top-[-12%] hidden sm:block h-auto w-2/5 select-none"
        />

        <HeroMeshGradient className="pointer-events-none absolute -inset-px -z-10 h-full" />
      </div>
    </section>
  )
}

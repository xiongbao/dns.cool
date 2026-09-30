import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroBanner() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <div className="relative overflow-hidden shadow-xs border border-muted rounded-2xl bg-[url(/banner-bg.svg)] bg-size-[auto_100%] bg-no-repeat bg-top-left">
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

        <div
          aria-hidden="true"
          className="grid-paper pointer-events-none absolute -inset-px -z-10 h-72"
        />
      </div>
    </section>
  )
}

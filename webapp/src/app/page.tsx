'use client';

import Link from 'next/link';
import { Shield, Terminal, Trophy, Users, ArrowRight, Lock, Bug, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const features = [
    {
      icon: Terminal,
      title: 'Labs แบบ Interactive',
      description: 'ฝึกเขียนโค้ดด้านความปลอดภัยผ่าน Lab ที่ออกแบบมาเพื่อให้เข้าใจแนวคิดจริงๆ',
    },
    {
      icon: Trophy,
      title: 'แข่งขันแบบ Team',
      description: 'สร้างทีมและแข่งขันกับทีมอื่นๆ เพื่อชิงตำแหน่ง Leaderboard',
    },
    {
      icon: Lock,
      title: 'Capture The Flag',
      description: 'แก้โจทย์ CTF หลากหลายระดับความยาก พร้อมรับคะแนนและ Badge',
    },
    {
      icon: Bug,
      title: 'Learn by Doing',
      description: 'เรียนรู้ผ่านการลงมือทำจริง ไม่ใช่แค่ทฤษฎี',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />
        <div className="container relative mx-auto px-4 py-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>Cyber Security Training Platform</span>
            </div>

            <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Blue Team Platform
              <span className="block text-emerald-400">ฝึกเขียนโค้ดด้านความปลอดภัย</span>
            </h1>

            <p className="mb-8 max-w-2xl text-lg text-zinc-400">
              แพลตฟอร์มสำหรับการเรียนรู้และฝึกฝนทักษะด้านความปลอดภัยทางไซเบอร์
              ด้วย Lab แบบ Interactive และการแข่งขันแบบ Capture The Flag
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/login">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  เริ่มต้นใช้งาน <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/labs">
                <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  ดู Labs <Code2 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">ฟีเจอร์สำคัญ</h2>
            <p className="text-zinc-400">เครื่องมือที่จะช่วยให้คุณพัฒนาทักษะด้าน Security ได้อย่างมีประสิทธิภาพ</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <feature.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-zinc-800 bg-zinc-900/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold text-emerald-400">50+</div>
              <div className="text-sm text-zinc-400">Cyber Labs</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-emerald-400">1000+</div>
              <div className="text-sm text-zinc-400">ผู้ใช้งาน</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-emerald-400">100+</div>
              <div className="text-sm text-zinc-400">ทีมที่เข้าร่วม</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">พร้อมแล้วหรือยัง?</h2>
          <p className="mb-8 text-lg text-zinc-400">
            ร่วมเป็นส่วนหนึ่งของชุมชน Blue Team และพัฒนาทักษะความปลอดภัยทางไซเบอร์ไปด้วยกัน
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                สมัครสมาชิกฟรี
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© 2026 Blue Team Platform. สร้างด้วย ❤️ สำหรับชุมชนคนไทย</p>
        </div>
      </footer>
    </div>
  );
}
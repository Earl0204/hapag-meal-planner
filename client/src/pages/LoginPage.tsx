import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Sparkles, Bot, CalendarRange, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Free photo by Stefan Vladimirov on Unsplash (Unsplash License — free for commercial use)
// https://unsplash.com/photos/white-plates-with-assorted-foods-Q_Moi2xjieU
const HERO_IMAGE = 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=1200&q=80&fit=crop&crop=center';

const FEATURES = [
  { icon: Bot,          label: 'AI Recipe Generation',  desc: 'Gemini-powered recipes mula sa inyong pantry' },
  { icon: CalendarRange, label: 'Weekly Meal Planning',  desc: 'Almusal hanggang hapunan, bawat araw' },
  { icon: BarChart3,    label: 'Bantay Presyo',          desc: 'Live market prices mula DA at DTI' },
];

export default function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      background: 'var(--bg)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '-20%', left: '40%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 64px',
        borderRight: '1px solid var(--border)',
        position: 'relative',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 8px 24px rgba(245,166,35,0.3)',
            border: '1px solid rgba(245,166,35,0.2)',
          }}>
            <img src="/icon.png" alt="Hapag" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>hapag</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ang Hapag ng Pamilya</div>
          </div>
        </div>

        {/* Hero text */}
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 }}>
          <span className="gradient-text">Ano ang ulam</span>
          <br />ngayon?
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.7, marginBottom: 28 }}>
          AI-powered meal planning para sa bawat pamilyang Pilipino. Mag-plan ng pagkain, bantayan ang pantry, at i-track ang presyo ng palengke.
        </p>

        {/* Hero food image */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative', marginBottom: 28,
        }}>
          <img
            src={HERO_IMAGE}
            alt="A beautiful spread of dishes on a dining table"
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,16,9,0.85) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Ang tunay na lutong bahay</div>
            <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.6)' }}>Photo by Stefan Vladimirov · Unsplash</div>
          </div>
        </div>

        {/* Features — lucide icons only, no emoji */}
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--accent-muted)',
              border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={17} color="var(--accent)" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right — Auth form */}
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={18} color="var(--accent)" />
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Libre ang magsimula</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>Mag-login sa Hapag</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Simulan ang inyong masustansiyang meal journey.</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(37, 90%, 55%)',
                  brandAccent: 'hsl(37, 85%, 48%)',
                  inputBackground: '#1a1712',
                  inputBorder: 'rgba(255,255,255,0.07)',
                  inputText: '#f0ece4',
                  inputPlaceholder: '#3d3a32',
                  messageText: '#f87171',
                  anchorTextColor: 'hsl(37, 90%, 55%)',
                  defaultButtonBackground: '#1a1712',
                  defaultButtonBackgroundHover: '#211e18',
                  defaultButtonBorder: 'rgba(255,255,255,0.07)',
                  defaultButtonText: '#f0ece4',
                },
                radii: { borderRadiusButton: '8px', inputBorderRadius: '8px' },
                fontSizes: { baseBodySize: '14px' },
                fonts: { bodyFontFamily: `'Plus Jakarta Sans', system-ui, sans-serif` },
              },
            },
          }}
          providers={['google']}
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_in: { email_label: 'Email', password_label: 'Password', button_label: 'Mag-login' },
              sign_up: { email_label: 'Email', password_label: 'Password', button_label: 'Mag-sign up' },
            },
          }}
        />
      </div>
    </div>
  );
}

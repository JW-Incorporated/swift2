import type { Era } from '@swift2/experience';
import { bucketLabel, type ShareCardSize } from './share-card-params';
import { headingStyleFor } from './share-card-fonts';
import { Cta, EraPill, Frame, alpha, fit, scaleFor, smallAccent } from './share-card-frame';
import type { ShareCardSpec } from './share-card-spec';

type Spec<K extends ShareCardSpec['kind']> = Extract<ShareCardSpec, { kind: K }>;

const middle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  justifyContent: 'center',
  margin: '28px 0',
} as const;

function Rule({ era }: { era: Era }) {
  return (
    <div
      style={{
        display: 'flex',
        width: 140,
        height: 8,
        borderRadius: 4,
        background: era.theme.accent,
        margin: '44px 0',
      }}
    />
  );
}

function Heading({ era, text, px, color }: { era: Era; text: string; px: number; color?: string }) {
  const h = headingStyleFor(era.theme.font);
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: h.fontFamily,
        fontWeight: h.fontWeight,
        ...(h.textTransform ? { textTransform: h.textTransform } : {}),
        letterSpacing: h.letterSpacing,
        fontSize: px,
        lineHeight: 1.04,
        color: color ?? era.theme.ink,
      }}
    >
      {text}
    </div>
  );
}

function Body({ era, text, px }: { era: Era; text: string; px: number }) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSize: px,
        lineHeight: 1.4,
        color: era.theme.inkSoft,
      }}
    >
      {text}
    </div>
  );
}

function Stamp({ era, label, px }: { era: Era; label: string; px: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        marginBottom: 36,
        padding: '10px 26px',
        border: `4px dashed ${era.theme.accent}`,
        borderRadius: 14,
        transform: 'rotate(-3deg)',
        fontFamily: 'Inter',
        fontWeight: 800,
        fontSize: px,
        letterSpacing: 6,
        textTransform: 'uppercase',
        color: smallAccent(era),
        background: alpha(era.theme.accent, 0.12),
      }}
    >
      {label}
    </div>
  );
}

export function MomentLayout({ spec, size }: { spec: Spec<'moment'>; size: ShareCardSize }) {
  const { era } = spec;
  const k = scaleFor(size);
  return (
    <Frame era={era} size={size}>
      <EraPill era={era} label={spec.dateLabel} />
      <div style={middle}>
        {spec.stamp && <Stamp era={era} label={spec.stamp} px={Math.round(36 * k)} />}
        <Heading
          era={era}
          text={spec.title}
          px={Math.round(
            fit(spec.title.length, [
              [22, 132],
              [44, 104],
              [74, 86],
              [999, 70],
            ]) * k,
          )}
        />
        <Rule era={era} />
        <Body era={era} text={spec.summary} px={Math.round(40 * k)} />
      </div>
      <Cta era={era} label={`${era.shortName} on Long Live`} />
    </Frame>
  );
}

export function EraLayout({ spec, size }: { spec: Spec<'era'>; size: ShareCardSize }) {
  const { era } = spec;
  const k = scaleFor(size);
  return (
    <Frame era={era} size={size}>
      <EraPill era={era} label={era.yearLabel} />
      <div style={middle}>
        <Heading
          era={era}
          text={era.name}
          px={Math.round(
            fit(era.name.length, [
              [8, 200],
              [14, 150],
              [999, 110],
            ]) * k,
          )}
        />
        <Rule era={era} />
        <Body era={era} text={era.tagline} px={Math.round(44 * k)} />
      </div>
      <Cta era={era} label="Step into the era" />
    </Frame>
  );
}

export function DefaultLayout({ spec, size }: { spec: Spec<'default'>; size: ShareCardSize }) {
  const { era } = spec;
  const k = scaleFor(size);
  return (
    <Frame era={era} size={size}>
      <EraPill era={era} label="The Taylor Swift time machine" />
      <div style={middle}>
        <Heading era={era} text="Long Live" px={Math.round(190 * k)} />
        <Rule era={era} />
        <Body
          era={era}
          text="Real-time updates on her whole life, or step back into any era."
          px={Math.round(44 * k)}
        />
      </div>
      <Cta era={era} label="Step into any era" />
    </Frame>
  );
}

function ErasRow({ era, rank, px, tight }: { era: Era; rank: number; px: number; tight: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: tight ? '18px 34px' : '26px 34px',
        marginBottom: 22,
        borderRadius: 28,
        border: `2px solid ${alpha(era.theme.accent, 0.4)}`,
        background: alpha(era.theme.accent, 0.1),
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 8,
          height: 78,
          borderRadius: 4,
          background: era.theme.accent,
          marginRight: 30,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Heading era={era} text={era.name} px={px} />
        <div
          style={{
            display: 'flex',
            marginTop: 8,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 4,
            color: era.theme.inkSoft,
          }}
        >
          {era.yearLabel}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: 64,
          color: alpha(era.theme.accent, 0.8),
        }}
      >
        {rank}
      </div>
    </div>
  );
}

function StatTile({ era, value, label }: { era: Era; value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <Heading era={era} text={bucketLabel(value)} px={92} color={era.theme.accent} />
      <div
        style={{
          display: 'flex',
          marginTop: 10,
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: era.theme.inkSoft,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function MyErasLayout({ spec, size }: { spec: Spec<'myEras'>; size: ShareCardSize }) {
  const [lead, second] = spec.eras;
  const k = scaleFor(size);
  const stats = [
    { value: spec.moments, label: 'Moments' },
    { value: spec.eggs, label: 'Eggs' },
    { value: spec.favorites, label: 'Saved' },
  ].filter((s) => s.value > 0);
  return (
    <Frame era={lead} size={size} secondary={second}>
      <EraPill era={lead} label="My Long Live" />
      <div style={middle}>
        <Heading era={lead} text="My Eras" px={Math.round((size === 'story' ? 168 : 128) * k)} />
        <div style={{ display: 'flex', height: size === 'story' ? 48 : 28 }} />
        {spec.eras.map((era, i) => (
          <ErasRow
            key={era.id}
            era={era}
            rank={i + 1}
            px={Math.round(60 * k)}
            tight={size !== 'story'}
          />
        ))}
        {stats.length > 0 && (
          <div style={{ display: 'flex', marginTop: size === 'story' ? 36 : 14 }}>
            {stats.map((s) => (
              <StatTile key={s.label} era={lead} value={s.value} label={s.label} />
            ))}
          </div>
        )}
      </div>
      <Cta era={lead} label="Find your eras" />
    </Frame>
  );
}

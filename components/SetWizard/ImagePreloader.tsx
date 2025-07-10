import Image from 'next/image';

export default function ImagePreloader() {
  return (
    <div className="hidden">
      {/* Proficiency level images - 1125x633 */}
      {[...Array(6)].map((_, i) => (
        <Image
          key={`level-${i + 1}`}
          src={`/images/level/${i + 1}.png`}
          alt=""
          width={1125}
          height={633}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      ))}
      {/* Tone step images - 1125x633 */}
      {[...Array(10)].map((_, i) => (
        <Image
          key={`level2-${i + 1}`}
          src={`/images/level2/${i + 1}.png`}
          alt=""
          width={1125}
          height={633}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      ))}
      {/* Welcome step donkey image */}
      <Image
        key="donkey"
        src="/images/donkeycards.png"
        alt=""
        width={1125}
        height={633}
        priority
        loading="eager"
        fetchPriority="high"
        unoptimized
      />
      {/* Default set logo */}
      <Image
        key="default-set"
        src="/images/default-set-logo.png"
        alt=""
        width={1125}
        height={633}
        priority
        loading="eager"
        fetchPriority="high"
        unoptimized
      />
    </div>
  );
} 
import Image from "next/image";
import Link from "next/link";
import type { Explorer } from "@/lib/explorers";
import styles from "./page.module.css";

export default function ExplorerCard({ explorer }: { explorer: Explorer }) {
  return (
    <Link href={`/explorers/${explorer.id}`} className={styles.card} data-world={explorer.world}>
      <Image
        className={styles.photo}
        src={`/explorer-art/${explorer.id}.webp`}
        alt=""
        width={480}
        height={360}
        unoptimized
      />
      <span className={styles.cardText}>
        <span className={styles.kind}>{explorer.kind}</span>
        <span className={styles.name}>{explorer.name}</span>
        <span className={styles.line}>{explorer.cardLine}</span>
        <span className={styles.explore}>
          <Image src="/figma/magnifier.svg" alt="" width={16} height={16} />
          Explore
        </span>
      </span>
    </Link>
  );
}

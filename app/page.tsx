import CreateRoomForm from "@/components/CreateRoomForm/CreateRoomForm";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.brand}>
            OtherRoom
          </span>

          <h1>
            Send unwanted conversations
            somewhere else.
          </h1>

          <p className={styles.intro}>
            Create an AI decoy, share its
            link, and see how long they
            last before your character
            becomes completely unbearable.
          </p>

          <a
            className={styles.cta}
            href="#create-room"
          >
            Create a decoy ↓
          </a>
        </div>
      </section>

      <section
        className={styles.howItWorks}
        aria-labelledby="how-it-works"
      >
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow}>
            How it works
          </span>

          <h2 id="how-it-works">
            Give them another room.
          </h2>

          <div className={styles.steps}>
            <article>
              <span className={styles.stepNumber}>
                1
              </span>

              <h3>
                Create your decoy
              </h3>

              <p>
                Pick a personality or
                invent your own increasingly
                unhinged character.
              </p>
            </article>

            <article>
              <span className={styles.stepNumber}>
                2
              </span>

              <h3>
                Send them the link
              </h3>

              <p>
                Your visitor gets a private
                chat with the AI character,
                not with you.
              </p>
            </article>

            <article>
              <span className={styles.stepNumber}>
                3
              </span>

              <h3>
                Watch the chaos
              </h3>

              <p>
                See how long they stayed,
                how many messages they sent,
                and how unhinged the decoy
                became.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="create-room"
        className={styles.creator}
      >
        <CreateRoomForm />
      </section>
    </main>
  );
}

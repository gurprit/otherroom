"use client";

import {
  useState,
} from "react";
import { personalities } from "@/lib/personalities";
import styles from "./CreateRoomForm.module.scss";

type CreateRoomApiResponse = {
  room?: {
    id: string;
  };

  managementToken?: string;

  error?: string;
};

type CreatedRoom = {
  id: string;
  characterName: string;
  publicUrl: string;
  managementUrl: string;
};

export default function CreateRoomForm() {
  const [
    characterName,
    setCharacterName,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    selectedPersonality,
    setSelectedPersonality,
  ] = useState(
    personalities[0].id
  );

  const [
    customPersonality,
    setCustomPersonality,
  ] = useState("");

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    createdRoom,
    setCreatedRoom,
  ] =
    useState<CreatedRoom | null>(
      null
    );

  const [
    copied,
    setCopied,
  ] =
    useState<
      "public" |
      "management" |
      null
    >(null);

  const isCustom =
    selectedPersonality ===
    "custom";

  async function copyText(
    value: string,
    type:
      | "public"
      | "management"
  ) {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(type);

      window.setTimeout(
        () => {
          setCopied(null);
        },
        1600
      );
    } catch (copyError) {
      console.error(
        "Copy failed:",
        copyError
      );
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const preset =
        personalities.find(
          (personality) =>
            personality.id ===
            selectedPersonality
        );

      const response =
        await fetch(
          "/api/rooms",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              characterName:
                characterName.trim(),

              username:
                username
                  .trim()
                  .replace(
                    /^@/,
                    ""
                  ),

              personalityId:
                isCustom
                  ? null
                  : selectedPersonality,

              personalityInstructions:
                isCustom
                  ? customPersonality.trim()
                  : preset?.instructions ??
                    "",
            }),
          }
        );

      const data =
        (await response.json()) as CreateRoomApiResponse;

      if (
        !response.ok ||
        !data.room?.id
      ) {
        throw new Error(
          data.error ??
            "Unable to create room."
        );
      }

      if (
        !data.managementToken
      ) {
        throw new Error(
          "Room was created without a management token."
        );
      }

      const managementPath =
        `/manage/${data.room.id}?token=${encodeURIComponent(
          data.managementToken
        )}`;

      const publicPath =
        `/room/${data.room.id}`;

      localStorage.setItem(
        `otherroom_management_${data.room.id}`,
        data.managementToken
      );

      localStorage.setItem(
        "otherroom_latest_management_url",
        managementPath
      );

      const origin =
        window.location.origin;

      setCreatedRoom({
        id:
          data.room.id,

        characterName:
          characterName.trim(),

        publicUrl:
          `${origin}${publicPath}`,

        managementUrl:
          `${origin}${managementPath}`,
      });
    } catch (requestError) {
      console.error(
        requestError
      );

      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to create room."
      );
    } finally {
      setIsCreating(false);
    }
  }

  function createAnotherRoom() {
    setCreatedRoom(null);
    setCopied(null);
    setCharacterName("");
    setUsername("");
    setSelectedPersonality(
      personalities[0].id
    );
    setCustomPersonality("");
    setError("");
  }

  if (createdRoom) {
    return (
      <div
        className={
          styles.container
        }
      >
        <header
          className={
            styles.header
          }
        >
          <span
            className={
              styles.logo
            }
          >
            OtherRoom
          </span>

          <div
            className={
              styles.readyBadge
            }
          >
            Room ready
          </div>

          <h1>
            {createdRoom.characterName}
            {" "}
            is ready.
          </h1>

          <p>
            Send the public link
            to whoever you want
            diverted. Keep your
            management link private.
          </p>
        </header>

        <div
          className={
            styles.readySections
          }
        >
          <section
            className={
              styles.linkCard
            }
          >
            <div
              className={
                styles.linkCardHeader
              }
            >
              <div>
                <span
                  className={
                    styles.step
                  }
                >
                  1
                </span>

                <h2>
                  Send them this link
                </h2>
              </div>

              <span
                className={
                  styles.publicBadge
                }
              >
                Public
              </span>
            </div>

            <p>
              Anyone with this link
              can chat with{" "}
              {
                createdRoom.characterName
              }
              .
            </p>

            <div
              className={
                styles.urlRow
              }
            >
              <div
                className={
                  styles.url
                }
              >
                {
                  createdRoom.publicUrl
                }
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    createdRoom.publicUrl,
                    "public"
                  )
                }
              >
                {copied ===
                "public"
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>
          </section>

          <section
            className={`${styles.linkCard} ${styles.privateCard}`}
          >
            <div
              className={
                styles.linkCardHeader
              }
            >
              <div>
                <span
                  className={
                    styles.step
                  }
                >
                  2
                </span>

                <h2>
                  Keep this private
                </h2>
              </div>

              <span
                className={
                  styles.privateBadge
                }
              >
                Private
              </span>
            </div>

            <p>
              This secret link opens
              your dashboard,
              leaderboard and room
              statistics. Do not send
              it to visitors.
            </p>

            <div
              className={
                styles.urlRow
              }
            >
              <div
                className={`${styles.url} ${styles.secretUrl}`}
              >
                {
                  createdRoom.managementUrl
                }
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    createdRoom.managementUrl,
                    "management"
                  )
                }
              >
                {copied ===
                "management"
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>

            <div
              className={
                styles.saveNotice
              }
            >
              🔐 Save this link.
              Without accounts, this
              is your key back into
              the room.
            </div>
          </section>

          <a
            className={
              styles.dashboardButton
            }
            href={
              createdRoom.managementUrl
            }
          >
            Open management dashboard
            →
          </a>

          <button
            className={
              styles.secondaryButton
            }
            type="button"
            onClick={
              createAnotherRoom
            }
          >
            Create another room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        styles.container
      }
    >
      <header
        className={
          styles.header
        }
      >
        <span
          className={
            styles.logo
          }
        >
          OtherRoom
        </span>

        <h1>
          Create a room
        </h1>

        <p>
          Create an AI character
          and give someone somewhere
          else to continue the
          conversation.
        </p>
      </header>

      <form
        className={
          styles.form
        }
        onSubmit={
          handleSubmit
        }
      >
        <div
          className={
            styles.field
          }
        >
          <label
            htmlFor="characterName"
          >
            Character name
          </label>

          <input
            id="characterName"
            name="characterName"
            type="text"
            placeholder="Barbara"
            value={
              characterName
            }
            onChange={(
              event
            ) =>
              setCharacterName(
                event.target.value
              )
            }
            required
          />
        </div>

        <div
          className={
            styles.field
          }
        >
          <label
            htmlFor="username"
          >
            Username
          </label>

          <div
            className={
              styles.usernameField
            }
          >
            <span>
              @
            </span>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="barbara"
              value={
                username
              }
              onChange={(
                event
              ) =>
                setUsername(
                  event.target.value
                )
              }
              required
            />
          </div>
        </div>

        <fieldset
          className={
            styles.personalities
          }
        >
          <legend>
            Personality
          </legend>

          <div
            className={
              styles.personalityList
            }
          >
            {personalities.map(
              (personality) => (
                <label
                  className={
                    styles.personality
                  }
                  key={
                    personality.id
                  }
                >
                  <input
                    type="radio"
                    name="personality"
                    value={
                      personality.id
                    }
                    checked={
                      selectedPersonality ===
                      personality.id
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedPersonality(
                        event.target.value
                      )
                    }
                  />

                  <span className={styles.personalityContent}>
                    <strong>
                      {
                        personality.name
                      }
                    </strong>

                    <small>
                      {
                        personality.description
                      }
                    </small>

                    <span className={styles.personalityExample}>
                      “{personality.example}”
                    </span>
                  </span>
                </label>
              )
            )}

            <label
              className={
                styles.personality
              }
            >
              <input
                type="radio"
                name="personality"
                value="custom"
                checked={
                  selectedPersonality ===
                  "custom"
                }
                onChange={(
                  event
                ) =>
                  setSelectedPersonality(
                    event.target.value
                  )
                }
              />

              <span className={styles.personalityContent}>
                <strong>
                  Custom
                </strong>

                <small>
                  Describe exactly
                  how you want your
                  character to behave.
                </small>

                <span className={styles.personalityExample}>
                  “You decide how strange this gets.”
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        {isCustom && (
          <div
            className={
              styles.field
            }
          >
            <label
              htmlFor="customPersonality"
            >
              Describe the
              personality
            </label>

            <textarea
              id="customPersonality"
              name="customPersonality"
              placeholder="Friendly and slightly awkward. Somehow turns every conversation into a story about conspiracy theories involving pigeons..."
              value={
                customPersonality
              }
              onChange={(
                event
              ) =>
                setCustomPersonality(
                  event.target.value
                )
              }
              required
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className={
              styles.error
            }
          >
            {error}
          </p>
        )}

        <button
          className={
            styles.submit
          }
          type="submit"
          disabled={
            isCreating
          }
        >
          {isCreating
            ? "Creating Room..."
            : "Create Room"}
        </button>
      </form>
    </div>
  );
}

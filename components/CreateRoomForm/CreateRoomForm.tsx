"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { personalities } from "@/lib/personalities";
import styles from "./CreateRoomForm.module.scss";

type CreateRoomApiResponse = {
  room?: {
    id: string;
  };

  managementToken?: string;

  error?: string;
};

export default function CreateRoomForm() {
  const router = useRouter();

  const [characterName, setCharacterName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState(
    personalities[0].id
  );
  const [customPersonality, setCustomPersonality] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const isCustom =
    selectedPersonality === "custom";

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
      const preset = personalities.find(
        (personality) =>
          personality.id === selectedPersonality
      );

      const response = await fetch(
        "/api/rooms",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            characterName:
              characterName.trim(),

            username:
              username
                .trim()
                .replace(/^@/, ""),

            personalityId:
              isCustom
                ? null
                : selectedPersonality,

            personalityInstructions:
              isCustom
                ? customPersonality.trim()
                : preset?.instructions ?? "",
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

      if (!data.managementToken) {
        throw new Error(
          "Room was created without a management token."
        );
      }

      const managementUrl =
        `/manage/${data.room.id}?token=${encodeURIComponent(
          data.managementToken
        )}`;

      localStorage.setItem(
        `otherroom_management_${data.room.id}`,
        data.managementToken
      );

      localStorage.setItem(
        "otherroom_latest_management_url",
        managementUrl
      );

      router.push(
        managementUrl
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create room."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>
          OtherRoom
        </span>

        <h1>Create a room</h1>

        <p>
          Create an AI character and give someone
          somewhere else to continue the conversation.
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <div className={styles.field}>
          <label htmlFor="characterName">
            Character name
          </label>

          <input
            id="characterName"
            name="characterName"
            type="text"
            placeholder="Barbara"
            value={characterName}
            onChange={(event) =>
              setCharacterName(event.target.value)
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="username">
            Username
          </label>

          <div className={styles.usernameField}>
            <span>@</span>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="barbara"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          </div>
        </div>

        <fieldset className={styles.personalities}>
          <legend>
            Personality
          </legend>

          <div className={styles.personalityList}>
            {personalities.map((personality) => (
              <label
                className={styles.personality}
                key={personality.id}
              >
                <input
                  type="radio"
                  name="personality"
                  value={personality.id}
                  checked={
                    selectedPersonality ===
                    personality.id
                  }
                  onChange={(event) =>
                    setSelectedPersonality(
                      event.target.value
                    )
                  }
                />

                <span>
                  <strong>
                    {personality.name}
                  </strong>

                  <small>
                    {personality.description}
                  </small>
                </span>
              </label>
            ))}

            <label className={styles.personality}>
              <input
                type="radio"
                name="personality"
                value="custom"
                checked={
                  selectedPersonality === "custom"
                }
                onChange={(event) =>
                  setSelectedPersonality(
                    event.target.value
                  )
                }
              />

              <span>
                <strong>
                  Custom
                </strong>

                <small>
                  Describe exactly how you want your
                  character to behave.
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        {isCustom && (
          <div className={styles.field}>
            <label htmlFor="customPersonality">
              Describe the personality
            </label>

            <textarea
              id="customPersonality"
              name="customPersonality"
              placeholder="Friendly and slightly awkward. Somehow turns every conversation into a story about conspiracy theories involving pigeons..."
              value={customPersonality}
              onChange={(event) =>
                setCustomPersonality(
                  event.target.value
                )
              }
              required
            />
          </div>
        )}

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <button
          className={styles.submit}
          type="submit"
          disabled={isCreating}
        >
          {isCreating
            ? "Creating Room..."
            : "Create Room"}
        </button>
      </form>
    </div>
  );
}

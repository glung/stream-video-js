import { FC, useCallback } from 'react';
import classnames from 'classnames';
import { StreamReaction } from '@stream-io/video-client';
import { useActiveCall } from '@stream-io/video-react-bindings';

import styles from './ReactionsPanel.module.css';

export const defaultEmojiReactions: Record<
  string,
  { emoji: string; label: string; custom: object; type: string }
> = {
  ':like:': {
    emoji: '👍',
    label: 'Like',
    custom: {},
    type: 'reaction',
  },

  ':raise-hand:': {
    emoji: '✋',
    label: 'Raise hand',
    custom: {},
    type: 'raised-hand',
  },
  ':fireworks:': {
    emoji: '🎉',
    label: 'Fireworks',
    custom: {},
    type: 'reaction',
  },
};

export type Props = {
  className?: string;
};

export const ReactionsPanel: FC<Props> = ({ className }) => {
  const activeCall = useActiveCall();

  const sendReaction = useCallback(
    (reaction: StreamReaction) => {
      activeCall?.sendReaction(reaction);
    },
    [activeCall],
  );

  const rootClassname = classnames(styles.root, className);

  return (
    <div className={rootClassname}>
      <ul className={styles.list}>
        {Object.keys(defaultEmojiReactions).map((key) => (
          <li
            key={key}
            className={styles.item}
            onClick={() =>
              sendReaction({
                type: defaultEmojiReactions[key].type,
                emoji_code: key,
                custom: defaultEmojiReactions[key].custom,
              })
            }
          >
            {defaultEmojiReactions[key].emoji}
            <span className={styles.label}>
              {defaultEmojiReactions[key].label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

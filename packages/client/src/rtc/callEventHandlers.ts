import type { SfuEvent } from '../gen/video/sfu/event/events';
import { Call } from './Call';

export const registerEventHandlers = (call: Call) => {
  watchForPublishQualityChangeEvents(call);
};

const watchForPublishQualityChangeEvents = (call: Call) => {
  call.on('changePublishQuality', (event: SfuEvent) => {
    if (event.eventPayload.oneofKind === 'changePublishQuality') {
      const videoSenders =
        event.eventPayload.changePublishQuality?.videoSenders;
      if (videoSenders && videoSenders.length > 0) {
        videoSenders.forEach((videoSender) => {
          const { layers } = videoSender;
          call.updatePublishQuality(
            layers.filter((l) => l.active).map((l) => l.name),
          );
        });
      }
    }
  });
};

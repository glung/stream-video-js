import 'dotenv/config';
import { beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('call types CRUD API', () => {
  let client: StreamVideoServerClient;
  const callTypeName = `calltype${generateUUIDv4()}`;

  beforeAll(() => {
    client = new StreamVideoServerClient(apiKey, {
      secret,
      logLevel: 'error',
    });
  });

  it('create', async () => {
    const createResponse = await client.createCallType({
      name: callTypeName,
    });

    expect(createResponse.name).toBe(callTypeName);
  });

  it('update', async () => {
    const updateResponse = await client.updateCallType(callTypeName, {
      settings: {
        audio: { mic_default_on: false, default_device: 'earpiece' },
      },
    });

    expect(updateResponse.settings.audio.mic_default_on).toBeFalsy();
    expect(updateResponse.settings.audio.default_device).toBe('earpiece');
  });

  it('read', async () => {
    const readResponse = await client.getCallTypes();

    expect(readResponse.call_types[callTypeName]).toContain({
      name: callTypeName,
    });
  });

  it('delete', async () => {
    await client.deleteCallType(callTypeName);

    await expect(() => client.getCallType(callTypeName)).rejects.toThrowError();
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

interface Credentials {
  name: string;
  email: string;
  password: string;
}

describe('Task Manager API (e2e)', () => {
  let app: INestApplication;
  const run = Date.now();
  const alice: Credentials = {
    name: 'Alice',
    email: `alice+${run}@example.com`,
    password: 'alice-pass-123',
  };
  const bob: Credentials = {
    name: 'Bob',
    email: `bob+${run}@example.com`,
    password: 'bob-pass-12345',
  };
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};

  const api = () => request(app.getHttpServer());
  const bearer = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    // Deleting a user cascades to their tasks.
    for (const who of ['alice', 'bob']) {
      if (ids[who])
        await api().delete(`/api/users/${ids[who]}`).set(bearer(who));
    }
    await app.close();
  });

  it('serves health without authentication', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('rejects protected routes without a token', async () => {
    await api().get('/api/tasks').expect(401);
    await api().get('/api/users').expect(401);
  });

  it('registers users and never exposes the password', async () => {
    for (const [who, creds] of [
      ['alice', alice],
      ['bob', bob],
    ] as const) {
      const res = await api()
        .post('/api/auth/register')
        .send(creds)
        .expect(201);
      expect(res.body.data.user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(creds.password);
      tokens[who] = res.body.data.accessToken;
      ids[who] = res.body.data.user.id;
    }
  });

  it('rejects duplicate emails, ignoring case', async () => {
    await api()
      .post('/api/auth/register')
      .send({ ...alice, email: alice.email.toUpperCase() })
      .expect(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await api()
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);
    await api()
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' })
      .expect(401);
  });

  it('validates task payloads', async () => {
    await api().post('/api/tasks').set(bearer('alice')).send({}).expect(400);
    await api()
      .post('/api/tasks')
      .set(bearer('alice'))
      .send({ title: 'x', unexpected: true })
      .expect(400);
  });

  it('supports the task lifecycle for its owner', async () => {
    const created = await api()
      .post('/api/tasks')
      .set(bearer('alice'))
      .send({ title: 'Buy milk' })
      .expect(201);
    const taskId = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ title: 'Buy milk', done: false });

    const updated = await api()
      .patch(`/api/tasks/${taskId}`)
      .set(bearer('alice'))
      .send({ done: true })
      .expect(200);
    expect(updated.body.data.done).toBe(true);

    const list = await api().get('/api/tasks').set(bearer('alice')).expect(200);
    expect(list.body.data.map((t: { id: string }) => t.id)).toContain(taskId);

    await api().delete(`/api/tasks/${taskId}`).set(bearer('alice')).expect(204);
    await api().get(`/api/tasks/${taskId}`).set(bearer('alice')).expect(404);
  });

  it("hides one user's tasks from another", async () => {
    const created = await api()
      .post('/api/tasks')
      .set(bearer('alice'))
      .send({ title: 'Private' })
      .expect(201);
    const taskId = created.body.data.id as string;

    await api().get(`/api/tasks/${taskId}`).set(bearer('bob')).expect(404);
    await api()
      .patch(`/api/tasks/${taskId}`)
      .set(bearer('bob'))
      .send({ done: true })
      .expect(404);
    await api().delete(`/api/tasks/${taskId}`).set(bearer('bob')).expect(404);

    const bobList = await api()
      .get('/api/tasks')
      .set(bearer('bob'))
      .expect(200);
    expect(bobList.body.data).toEqual([]);
  });

  it('rejects a malformed uuid with 400', async () => {
    await api().get('/api/users/not-a-uuid').set(bearer('alice')).expect(400);
  });
});

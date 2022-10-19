import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StreamVideoService } from './stream-video.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  ownMediaStream?: MediaStream;
  user$: Observable<any>;
  private subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private videoService: StreamVideoService,
  ) {
    this.user$ = this.videoService.user$;
  }

  async ngOnInit() {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const user = environment.user;
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    const client = this.videoService.init(
      apiKey,
      token,
      baseCoordinatorUrl,
      baseWsUrl,
    );
    await client.connect(apiKey, token, user);
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        if (params['callid']) {
          const callId = params['callid'];
          await this.getOwnMediaStream();
          await this.joinCall(callId);
        }
      }),
    );
    this.subscriptions.push(
      this.videoService.activeCall$.subscribe((c) =>
        console.log('Store changed', c),
      ),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private async joinCall(id: string, type = 'default') {
    const call = await this.videoService.videoClient?.joinCall({
      id,
      type,
      datacenterId: 'amsterdam',
    });
    await call?.join();
    console.log('joined call');
  }

  private async getOwnMediaStream() {
    const constraints = { audio: true, video: { width: 1280, height: 720 } };
    this.ownMediaStream = await navigator.mediaDevices.getUserMedia(
      constraints,
    );
  }
}

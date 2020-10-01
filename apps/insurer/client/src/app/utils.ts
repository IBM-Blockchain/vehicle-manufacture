/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
export class EventListener {
    private _forceClose = false;
    private connectRetries = 0;
    private eventSource: any;

    constructor(private readonly url, private readonly onMessage: (evt: any) => void) {}

    public setup() {
        this.eventSource = new (window as any).EventSource(this.url);
        this.eventSource.onopen = (evt) => {
          console.log('OPEN', evt);
        };
    
        this.eventSource.onerror = (evt) => {
            console.log('ERROR', evt);

            this.connectRetries++;

            if (this.connectRetries < 600) {
                console.log('RETRYING CONNECTION', this.connectRetries);
      
                setTimeout(() => {
                  this.setup();
                }, 100);
              }
        };
    
        this.eventSource.onclose = (evt) => {
          console.error('EventSource listener closed');

          if (!this._forceClose) {
            this.setup();   
          }
        };
    
        this.eventSource.onmessage = (evt) => {
          const event = JSON.parse(evt.data);
          this.onMessage(event);
        };
    }

    forceClose() {
        this._forceClose = true;

        this.eventSource.close();
    }
} 
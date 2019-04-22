import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { UploadEvent, UploadFile, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { FILE_SERVICE } from '../../../models';

class ImageSnippet {
  constructor(public src: string, public file: File) {}
}

@Component({
  selector: 'app-orm',
  templateUrl: './orm.page.html',
  styleUrls: ['./orm.page.scss'],
})
export class OrmPage implements OnInit {

  
  public file;
  public items = [];
  public files = [];

  public item = {
    name:'',
    note: '',
  };

  subscriptions = [];

  constructor( public dataService: DataService) { }

  //selectedFile: ImageSnippet;

  async processFile(imageInput: any) {
    this.file = imageInput.files[0];
    //const res = await this.dataService.save({'name': 'testing'}, FILE_SERVICE, null, file, file.type);
  }




  public dropped(event: UploadEvent) {

    for (const droppedFile of event.files) {

      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.file = file;
          // Here you can access the real file
          //const res = await this.dataService.save({'name': 'testing'}, FILE_SERVICE, null, file, file.type);

          /**
          // You could upload it like this:
          const formData = new FormData()
          formData.append('logo', file, relativePath)

          // Headers
          const headers = new HttpHeaders({
            'security-token': 'mytoken'
          })

          this.http.post('https://mybackend.com/api/upload/sanitize-and-save-logo', formData, { headers: headers, responseType: 'blob' })
          .subscribe(data => {
            // Sanitized logo returned from backend
          })
          **/

        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
      }
    }
  }

  public fileOver(event){
  }

  public fileLeave(event){
  }



  async ngOnInit() {
    

  }
  
}

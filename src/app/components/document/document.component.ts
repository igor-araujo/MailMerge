const ContentTools = require('assets/contentTools/content-tools.min');


import { Component, OnInit, inject } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {

  isShowDetails: boolean;
  isEditable: boolean;
  private editor: any;
  private fs;

  constructor(public electronService: ElectronService) {

  }

  ngOnInit() {
    this.isShowDetails = false;
    this.isEditable = false;
    ContentTools.IMAGE_UPLOADER = this.imageUploader;
    ContentTools.StylePalette.add([
      new ContentTools.Style('title-table','title-table',['th']),
      new ContentTools.Style('cell-table','cell-table',['td','tr','tbody']),
      new ContentTools.Style('text-justify','text-justify',['p','td']),
      new ContentTools.Style('Arial-XX-Small','arial-xx-small',['td','th','p']),
      new ContentTools.Style('Arial-X-Small','arial-x-small',['td','th','p']),
      new ContentTools.Style('Arial-Smaller','arial-smaller',['td','th','p']),
      new ContentTools.Style('Arial-Small','arial-small',['td','th','p']),
      new ContentTools.Style('Arial-Medium','arial-medium',['td','th','p']),
      new ContentTools.Style('Arial-Large','arial-large',['td','th','p']),
      new ContentTools.Style('Arial-Larger','arial-larger',['td','th','p']),
      new ContentTools.Style('Arial-X-Larger','arial-x-larger',['td','th','p']),
      new ContentTools.Style('Arial-XX-Larger','arial-xx-larger',['td','th','p'])
    ])
    this.editor = ContentTools.EditorApp.get();
    this.editor.init('[data-editable]', 'main-content', null, false);
  }

  showDetails(show: boolean) {
    this.isShowDetails = show;
  }

  setEditable() {
    this.isEditable = true;
    // Starting the editor manually
    this.editor.start();
  }

  saveDocument() {
    this.isEditable = false;
    // Stoping the editor manually (save)
    this.editor.stop(true);
    new ContentTools.FlashUI('ok');
  }

  closeDocument() {
    // Stoping the editor manually (cancel)
    if (this.editor.stop(false)) {
      this.isEditable = false;
    }
  }

  imageUploader(dialog) {
    var image, xhr, xhrComplete, xhrProgress;
    dialog.addEventListener('imageuploader.cancelupload', function () {
      // Cancel the current upload

      // Stop the upload
      if (xhr) {
        xhr.upload.removeEventListener('progress', xhrProgress);
        xhr.removeEventListener('readystatechange', xhrComplete);
        xhr.abort();
      }

      // Set the dialog to empty
      dialog.state('empty');
    });

    dialog.addEventListener('imageuploader.clear', function () {
      // Clear the current image
      dialog.clear();
      image = null;
    });

    dialog.addEventListener('imageuploader.fileready', function (ev) {

      // Upload a file to the server
      var formData;
      var file = ev.detail().file;
      console.log(file);

      // Set the dialog state to uploading and reset the progress bar to 0
      dialog.state('uploading');
      dialog.progress(0);

      const fs = window.require('fs');
      const sizeOf = require('image-size');

      var dimensions = sizeOf(file.path);
      var img = fs.readFileSync(file.path);
      var base64 = new Buffer(img).toString('base64');
      image = {url:"data:" + file.type + ";base64," + base64, size:[dimensions.width, dimensions.height], name: file.name};
      dialog.populate(image.url, image.size);
    });

    function rotateImage(direction) {
      
      // Set the dialog to busy while the rotate is performed
      dialog.busy(true);

      var tnCanvas = document.createElement('canvas');
      var tnCanvasContext = tnCanvas.getContext('2d');
      var imageTmp = new Image;
      imageTmp.src = image.url;

      tnCanvas.width = imageTmp.height;
      tnCanvas.height = imageTmp.width;

      tnCanvasContext.clearRect(0, 0, tnCanvas.width, tnCanvas.height);
      tnCanvasContext.translate(imageTmp.height/2,imageTmp.width/2);
      tnCanvasContext.rotate(direction*Math.PI/180);
      tnCanvasContext.drawImage(imageTmp,-imageTmp.width/2,-imageTmp.height/2);

      image.url = tnCanvas.toDataURL();
      image.size = [tnCanvas.width, tnCanvas.height];
      // Populate the dialog
      dialog.populate(image.url, image.size);

      // Free the dialog from its busy state
      dialog.busy(false);
    }

    dialog.addEventListener('imageuploader.rotateccw', function () {
      rotateImage(270);
    });

    dialog.addEventListener('imageuploader.rotatecw', function () {
      rotateImage(90);
    });

    dialog.addEventListener('imageuploader.save', function () {
      var crop, cropRegion, formData;

      // Set the dialog to busy while the rotate is performed
      dialog.busy(true);
      
      // Check if a crop region has been defined by the user
      if (dialog.cropRegion()) {
        console.log(dialog.cropRegion());
      }
      
      dialog.save(
        image.url,
        image.size,
        {
          'alt': image.name,
          'data-ce-max-width': image.size[0]
        });
      // Free the dialog from its busy state
      dialog.busy(false);


    });

  }
}

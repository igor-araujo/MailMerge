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
    this.fs = this.electronService.remote.require('fs');
    console.log(this.fs);
  }

  ngOnInit() {
    this.isShowDetails = false;
    this.isEditable = false;
    ContentTools.IMAGE_UPLOADER = this.imageUploader;
    this.editor = ContentTools.EditorApp.get();
    this.editor.init('*[data-editable]', 'main-content', null, false);
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
      // Define functions to handle upload progress and completion
      xhrProgress = function (ev) {
        // Set the progress for the upload
        dialog.progress((ev.loaded / ev.total) * 100);
      }

      xhrComplete = function (ev) {
        var response;

        // Check the request is complete
        if (ev.target.readyState != 4) {
          return;
        }

        // Clear the request
        xhr = null
        xhrProgress = null
        xhrComplete = null

        // Handle the result of the upload
        if (parseInt(ev.target.status) == 200) {
          // Unpack the response (from JSON)
          response = JSON.parse(ev.target.responseText);

          // Store the image details
          image = {
            size: response.size,
            url: response.url
          };

          // Populate the dialog
          dialog.populate(image.url, image.size);

        } else {
          // The request failed, notify the user
          new ContentTools.FlashUI('no');
        }
      }

      // Set the dialog state to uploading and reset the progress bar to 0
      dialog.state('uploading');
      dialog.progress(0);

      // Build the form data to post to the server
      formData = new FormData();
      formData.append('image', file);

      // Make the request
      xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', xhrProgress);
      xhr.addEventListener('readystatechange', xhrComplete);
      xhr.open('POST', '/upload-image', true);
      xhr.send(formData);
    });

    function rotateImage(direction) {
      // Request a rotated version of the image from the server
      var formData;

      // Define a function to handle the request completion
      xhrComplete = function (ev) {
        var response;

        // Check the request is complete
        if (ev.target.readyState != 4) {
          return;
        }

        // Clear the request
        xhr = null
        xhrComplete = null

        // Free the dialog from its busy state
        dialog.busy(false);

        // Handle the result of the rotation
        if (parseInt(ev.target.status) == 200) {
          // Unpack the response (from JSON)
          response = JSON.parse(ev.target.responseText);

          // Store the image details (use fake param to force refresh)
          image = {
            size: response.size,
            url: response.url + '?_ignore=' + Date.now()
          };

          // Populate the dialog
          dialog.populate(image.url, image.size);

        } else {
          // The request failed, notify the user
          new ContentTools.FlashUI('no');
        }
      }

      // Set the dialog to busy while the rotate is performed
      dialog.busy(true);

      // Build the form data to post to the server
      formData = new FormData();
      formData.append('url', image.url);
      formData.append('direction', direction);

      // Make the request
      xhr = new XMLHttpRequest();
      xhr.addEventListener('readystatechange', xhrComplete);
      xhr.open('POST', '/rotate-image', true);
      xhr.send(formData);
    }

    dialog.addEventListener('imageuploader.rotateccw', function () {
      rotateImage('CCW');
    });

    dialog.addEventListener('imageuploader.rotatecw', function () {
      rotateImage('CW');
    });

    dialog.addEventListener('imageuploader.save', function () {
      var crop, cropRegion, formData;

      // Define a function to handle the request completion
      xhrComplete = function (ev) {
        // Check the request is complete
        if (ev.target.readyState !== 4) {
          return;
        }

        // Clear the request
        xhr = null
        xhrComplete = null

        // Free the dialog from its busy state
        dialog.busy(false);

        // Handle the result of the rotation
        if (parseInt(ev.target.status) === 200) {
          // Unpack the response (from JSON)
          var response = JSON.parse(ev.target.responseText);

          // Trigger the save event against the dialog with details of the
          // image to be inserted.
          dialog.save(
            response.url,
            response.size,
            {
              'alt': response.alt,
              'data-ce-max-width': response.size[0]
            });

        } else {
          // The request failed, notify the user
          new ContentTools.FlashUI('no');
        }
      }

      // Set the dialog to busy while the rotate is performed
      dialog.busy(true);

      // Build the form data to post to the server
      formData = new FormData();
      formData.append('url', image.url);

      // Set the width of the image when it's inserted, this is a default
      // the user will be able to resize the image afterwards.
      formData.append('width', 600);

      // Check if a crop region has been defined by the user
      if (dialog.cropRegion()) {
        formData.append('crop', dialog.cropRegion());
      }

      // Make the request
      xhr = new XMLHttpRequest();
      xhr.addEventListener('readystatechange', xhrComplete);
      xhr.open('POST', '/insert-image', true);
      xhr.send(formData);
    });

  }
}

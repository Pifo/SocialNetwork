// Change later to a more concrete selector
var selector = document.body;

// Trigger file selection window
$(selector).on('click', '#upload-file-button', function () {
    $('#picture').click();
});

// Reads the selected file and returns the data as a base64 encoded string
$(selector).on('change', '#picture', function () {
    var file = this.files[0], reader;

    if (file.type.match(/image\/.*/)) {

        reader = new FileReader();
        reader.onload = function () {

            $('.picture-name').text(file.name);
            $('.picture-preview').attr('src', reader.result);
            $('#picture').attr('data-picture-data', reader.result);
        };

        reader.readAsDataURL(file);
    } else {
        alert("Connot load picture");
    }
});
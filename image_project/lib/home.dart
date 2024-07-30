import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image/image.dart' as img;

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  File? _image;
  List<String> _relatedImages = [];
  final picker = ImagePicker();

  Future<void> _getImage(ImageSource source) async {
    final pickedFile = await picker.pickImage(source: source);

    if (pickedFile != null) {
      try {
        File resizedImage = await _resizeImage(File(pickedFile.path));
        setState(() {
          _image = resizedImage;
        });

        await _uploadImage(resizedImage);
      } catch (e) {
        print('Error processing image: $e');
      }
    } else {
      print('No image selected.');
    }
  }

  Future<File> _resizeImage(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    img.Image? image = img.decodeImage(bytes);

    if (image != null) {
      img.Image resized = img.copyResize(image, width: 200, height: 150);
      final resizedBytes = img.encodeJpg(resized);

      final resizedImageFile = File(imageFile.path.replaceFirst('.jpg', '_resized.jpg'));
      await resizedImageFile.writeAsBytes(resizedBytes);

      print('Resized image path: ${resizedImageFile.path}');
      print('Resized image size: ${resizedBytes.length} bytes');

      return resizedImageFile;
    } else {
      throw Exception('Failed to decode image.');
    }
  }

  Future<void> _uploadImage(File imageFile) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://192.168.0.102:4000/api/related-images')
      );
      request.files.add(
        await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
          contentType: MediaType('image', 'jpeg'),
        ),
      );

      request.fields['prompt'] = 'Generate related images';
      request.fields['mode'] = 'image-to-image';
      request.fields['strength'] = '0.5';

      print('Uploading image: ${imageFile.path}');

      var response = await request.send();
      print('Response status: ${response.statusCode}');

      var responseData = await response.stream.bytesToString();
      print('Response data: $responseData');

      if (response.statusCode == 200) {
        var decodedData = json.decode(responseData);

        print('Decoded response data: $decodedData');

        setState(() {
          _relatedImages = decodedData.containsKey('relatedImages')
              ? List<String>.from(decodedData['relatedImages'])
              : [];
        });
        print('Related images updated.');
      } else {
        print('Error uploading image: ${response.statusCode}');
        print('Response body: $responseData');
      }
    } catch (e) {
      print('Error uploading image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Image Search App'),
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              _image == null
                  ? Text('Select an image to find related images')
                  : Image.file(_image!),
              SizedBox(height: 20.0),
              ElevatedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: Text('Select Image Source'),
                        actions: <Widget>[
                          TextButton(
                            child: Text('Camera'),
                            onPressed: () {
                              Navigator.of(context).pop();
                              _getImage(ImageSource.camera);
                            },
                          ),
                          TextButton(
                            child: Text('Gallery'),
                            onPressed: () {
                              Navigator.of(context).pop();
                              _getImage(ImageSource.gallery);
                            },
                          ),
                        ],
                      );
                    },
                  );
                },
                child: Text('Upload Image'),
              ),
              SizedBox(height: 20.0),
              _relatedImages.isNotEmpty
                  ? Column(
                      children: <Widget>[
                        Text('Related Images:', style: TextStyle(fontSize: 18.0)),
                        SizedBox(height: 10.0),
                        Wrap(
                          spacing: 10.0,
                          runSpacing: 10.0,
                          children: _relatedImages.map((imageUrl) {
                            return Image.network(
                              imageUrl,
                              width: 100.0,
                              height: 100.0,
                            );
                          }).toList(),
                        ),
                      ],
                    )
                  : Text('No related images found'),
            ],
          ),
        ),
      ),
    );
  }
}

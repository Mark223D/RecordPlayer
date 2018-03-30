/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  PermissionsAndroid,
  TouchableHighlight,
} from 'react-native';
import Sound from 'react-native-sound';
import {AudioRecorder, AudioUtils}from 'react-native-audio';

export default class App extends Component {
    state = {
        currentTime: 0.0,
        recording: false,
        paused: false,
        stoppedRecording: false,
        finished: false,
        audioPath: AudioUtils.DocumentDirectoryPath + '/test.aac',
        hasPermission: undefined,
    };

    prepareRecordingPath(audioPath){
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 22050,
            Channels: 1,
            AudioQuality: "Low",
            AudioEncoding: "aac",
            AudioEncodingBitRate: 32000
        });
    }

    componentDidMount() {
        this.checkPermission().then((hasPermission) => {
            this.setState({ hasPermission });

            if (!hasPermission) return;

            this.prepareRecordingPath(this.state.audioPath);

            AudioRecorder.onProgress = (data) => {
                this.setState({currentTime: Math.floor(data.currentTime)});
            };

            AudioRecorder.onFinished = (data) => {
                // Android callback comes in the form of a promise instead.
                if (Platform.OS === 'ios') {
                    this._finishRecording(data.status === "OK", data.audioFileURL);
                }
            };
        });
    }

    checkPermission() {
        if (Platform.OS !== 'android') {
            return Promise.resolve(true);
        }

        const rationale = {
            'title': 'Microphone Permission',
            'message': 'AudioExample needs access to your microphone so you can record audio.'
        };

        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale)
            .then((result) => {
                console.log('Permission result:', result);
                return (result === true || result === PermissionsAndroid.RESULTS.GRANTED);
            });
    }

    renderButton(title, onPress, active) {
        var style = (active) ? styles.activeButtonText : styles.buttonText;

        return (
            <TouchableHighlight style={styles.button} onPress={onPress}>
                <Text style={style}>
                    {title}
                </Text>
            </TouchableHighlight>
        );
    }

    async pause() {
        if (!this.state.recording) {
            console.warn('Can\'t pause, not recording!');
            return;
        }

        try {
            const filePath = await AudioRecorder.pauseRecording();
            this.setState({paused: true});
        } catch (error) {
            console.error(error);
        }
    }


    async stop() {
        if (!this.state.recording) {
            console.warn('Can\'t stop, not recording!');
            return;
        }

        this.setState({stoppedRecording: true, recording: false, paused: false});

        try {
            const filePath = await AudioRecorder.stopRecording();

            if (Platform.OS === 'android') {
                this.finishRecording(true, filePath);
            }
            return filePath;
        } catch (error) {
            console.error(error);
        }
    }

    async play() {
        if (this.state.recording) {
            await this.stop();
        }

        setTimeout(() => {
            const sound = new Sound(this.state.audioPath, '', (error) => {
                if (error) {
                    console.log('Sound Loading has Failed: ', error);
                }
            });

            setTimeout(() => {
                sound.play((success) => {
                    if (success) {
                        console.log('Played Successfully');
                    } else {
                        console.log('PlayBack Fail: Decoding Errors');
                    }
                });
            }, 100);
        }, 100);
    }

    async record() {
        if (this.state.recording) {
            console.warn('Already recording!');
            return;
        }

        if (!this.state.hasPermission) {
            console.warn('Can\'t record, no permission granted!');
            return;
        }

        if(this.state.stoppedRecording){
            this.prepareRecordingPath(this.state.audioPath);
        }

        this.setState({recording: true, paused: false});

        try {
            const filePath = await AudioRecorder.startRecording();
        } catch (error) {
            console.error(error);
        }
    }

    _finishRecording(didSucceed, filePath) {
        console.log(`Finished recording duration ${this.state.currentTime} seconds at path: ${filePath}`);
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.controls}>
                    {this.renderButton("RECORD", () => {this.record()}, this.state.recording )}
                    {this.renderButton("PLAY", () => {
                        this.play()


                    } )}
                    {this.renderButton("STOP", () => {this.stop()} )}
                    {this.renderButton("PAUSE", () => {this.pause()} )}
                    <Text style={styles.progressText}>{this.state.currentTime}s</Text>
                </View>
            </View>
        );
    }
}

var styles = StyleSheet.create({
                container: {
                flex: 1,
                backgroundColor: "#2b608a",
            },
                controls: {
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
            },
                progressText: {
                paddingTop: 50,
                fontSize: 50,
                color: "#fff"
            },
                button: {
                padding: 20
            },
                disabledButtonText: {
                color: '#eee'
            },
                buttonText: {
                fontSize: 20,
                color: "#fff"
            },
                activeButtonText: {
                fontSize: 20,
                color: "#B81F00"
            }
});
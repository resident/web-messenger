import {useContext, useEffect, useRef, useState} from "react";
import {ApplicationContext} from "@/Components/ApplicationContext.jsx";
import Media from "@/Common/Media.js";
import {PhoneIcon, PhoneXMarkIcon, VideoCameraIcon} from "@heroicons/react/24/outline/index.js";

export default function () {
    const {
        user,
        outputCall, setOutputCall,
    } = useContext(ApplicationContext);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const offerRef = useRef(null);
    const remoteUserRef = useRef(null);
    const iceCandidatesRef = useRef([]);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);

    const [remoteUser, setRemoteUser] = useState(null);
    const [isAudioCall, setIsAudioCall] = useState(false);
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [callWindowIsVisible, setCallWindowIsVisible] = useState(false);
    const [answered, setAnswered] = useState(false);

    const showCallWindow = () => {
        setCallWindowIsVisible(true);
    };

    const closeCallWindow = () => {
        setCallWindowIsVisible(false);
    }

    const getCallMediaType = () => isAudioCall ? "audio" : isVideoCall ? "video" : null;

    const setCallMediaType = (type) => {
        switch (type) {
            case "audio":
                setIsAudioCall(true);
                setIsVideoCall(false);
                break;
            case "video":
                setIsAudioCall(false);
                setIsVideoCall(true);
                break;
        }
    };

    const sendSdpDescription = async (fromUser, toUser, mediaType, description) => {
        return axios.post(route('user-call.sdp-description', [fromUser.id, toUser.id]), {
            media_type: mediaType,
            description,
        });
    };

    const sendIceCandidate = async (user, candidate) => {
        return axios.post(route('user-call.ice-candidate', user.id), {candidate});
    };

    const sendCallEnded = async (user) => {
        return axios.post(route('user-call.end-call', user.id));
    };

    useEffect(() => {
        if (outputCall) {
            setCallMediaType(outputCall.type);

            setAnswered(false);

            remoteUserRef.current = outputCall.toUser;
            setRemoteUser(outputCall.toUser);

            showCallWindow();

            initWebRtc({media: {audio: true, video: outputCall.type === 'video'}}).then(async () => {
                // Send SDP offer
                const offer = await peerConnectionRef.current.createOffer();

                await peerConnectionRef.current.setLocalDescription(offer);

                console.log('offer description', {offer});

                await sendSdpDescription(outputCall.fromUser, outputCall.toUser, outputCall.type, offer);
            });
        }
    }, [outputCall]);

    const addIceCandidates = async () => {
        const promises = [];

        while (iceCandidatesRef.current.length > 0) {
            const candidate = iceCandidatesRef.current.shift();

            promises.push(
                peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            );
        }

        return Promise.all(promises);
    };


    const handleOffer = async (offer) => {
        console.log('handleOffer() called')

        setAnswered(false);

        offerRef.current = offer;

        showCallWindow();
    };

    const handleAnswer = async (answer) => {
        console.log('handleAnswer() called')

        try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

            await addIceCandidates();

            setAnswered(true);
        } catch (error) {
            console.error("Error processing answer:", error);
        }
    };

    const handleCandidate = async (candidate) => {
        try {
            //Add candidate to buffer
            iceCandidatesRef.current.push(candidate);

            if (peerConnectionRef.current?.remoteDescription) {
                //Add candidates from buffer
                await addIceCandidates();
            }
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    };

    const onSdpDescription = async (e) => {
        console.log('onSdpDescription called');
        console.log('e', e);

        setCallMediaType(e.mediaType);

        remoteUserRef.current = e.fromUser;
        setRemoteUser(e.fromUser);

        switch (e.description.type) {
            case "offer":
                await handleOffer(e.description);
                break;
            case "answer":
                await handleAnswer(e.description);
                break;
            default:
                break;
        }
    };

    const onIceCandidate = async (e) => {
        console.log('onIceCandidate called');
        console.log('e', e);

        await handleCandidate(e.candidate);
    };

    const onCallEnded = () => endCall();

    const initWebRtc = async (options) => {
        const stream = await Media.getMediaStream(options.media);

        localVideoRef.current.srcObject = localStreamRef.current = stream;

        const configuration = {
            iceServers: [{urls: "stun:stun.l.google.com:19302"}]
        };

        peerConnectionRef.current = new RTCPeerConnection(configuration);

        stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));

        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('candidate', {candidate: event.candidate})

                sendIceCandidate(remoteUserRef.current, event.candidate);
            }
        };

        peerConnectionRef.current.ontrack = (event) => {
            console.log('peerConnection.current.ontrack');
            console.log('event', event)

            const [remoteStream] = event.streams;

            remoteStreamRef.current = remoteStream;

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        };
    };

    // WebRTC init
    useEffect(() => {
        const channel = `user-call.${user.id}`;

        Echo.private(channel)
            .listen('UserCall\\SdpDescription', onSdpDescription)
            .listen('UserCall\\IceCandidate', onIceCandidate)
            .listen('UserCall\\CallEnded', onCallEnded);

        return () => {
            Echo.leave(channel);
        };
    }, []);

    const stopStreams = streams => {
        for (const stream of streams) {
            if (stream.current) {
                stream.current.getTracks().forEach(track => {
                    track.stop();
                });

                stream.current = null;
            }
        }
    };

    const endCall = () => {
        stopStreams([localStreamRef, remoteStreamRef]);

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Reset state
        setRemoteUser(null);
        remoteUserRef.current = null;
        iceCandidatesRef.current = [];
        setOutputCall(null);

        closeCallWindow();

        console.log("Call ended");
    };

    const onAcceptCall = async () => {
        setAnswered(true);

        try {
            await initWebRtc({media: {audio: true, video: isVideoCall}});

            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offerRef.current));

            offerRef.current = null;

            await addIceCandidates();

            const answer = await peerConnectionRef.current.createAnswer();

            await peerConnectionRef.current.setLocalDescription(answer);

            await sendSdpDescription(user, remoteUserRef.current, getCallMediaType(), answer);
        } catch (error) {
            console.error("Error processing offer:", error);
        }
    };

    const onEndCall = async () => {
        await sendCallEnded(remoteUserRef.current);

        endCall();
    };

    return (
        <div
            className={`
                ${!callWindowIsVisible && 'hidden'}
                z-60 p-3 absolute top-0 left-0
                w-dvw h-dvh
                flex flex-col gap-3 justify-center
                bg-cyan-800
            `}
        >
            <div className={`${(answered && isVideoCall) && 'hidden'}`}>
                <div className={`h-[90dvh] flex gap-3 items-center justify-center`}>
                    <div className={`flex flex-col gap-3`}>
                        <div className={`size-40 rounded-full bg-lime-300`}></div>
                        <div className={`text-center text-white font-bold text-xl`}>{remoteUser?.name}</div>
                    </div>
                </div>
            </div>

            <div className={`relative w-full h-full`}>


                <div className={`
                        ${(!isVideoCall || !answered) && 'hidden'} flex flex-col gap-3 h-full justify-center
                    `}
                >
                    <video
                        className={`w-full border border-black bg-black max-w-full max-h-full`}
                        ref={remoteVideoRef}
                        autoPlay></video>

                    <video
                        className={`w-full border border-black bg-black sm:max-w-[30dvw] sm:max-h-[30dvh] sm:absolute bottom-0 right-0`}
                        ref={localVideoRef}
                        autoPlay></video>

                </div>

                <div className={`absolute bottom-0 w-full`}>
                    <div className={`mt-3 flex gap-4 justify-center`}>
                        <div className={`
                        ${(answered || outputCall) && 'hidden'}
                        p-2 bg-green-500 hover:bg-green-700 rounded-full
                    `}
                             onClick={onAcceptCall}>
                            <PhoneIcon className={`${!isAudioCall && 'hidden'} size-8`}/>
                            <VideoCameraIcon className={`${!isVideoCall && 'hidden'} size-8`}/>
                        </div>

                        <div className={`p-2 bg-red-500 hover:bg-red-700 rounded-full`} onClick={onEndCall}>
                            <PhoneXMarkIcon className={`size-8 `}/>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}

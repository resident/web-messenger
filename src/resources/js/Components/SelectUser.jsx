import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import InputError from "@/Components/InputError.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import {useRef, useState} from "react";

export default function SelectUser({label = 'User Name', buttonText = 'Select', onUserSelected = user => null}) {
    const nameInput = useRef();

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState(null);

    const selectUser = (e) => {
        e.preventDefault();

        axios.get(route('users.get', name))
            .then(function (response) {
                nameInput.current.value = '';

                onUserSelected(response.data);
            })
            .catch(function (error) {
                setNameError(error.response.data.message);
            });
    };

    return (
        <div>
            <InputLabel htmlFor="name" value={label}/>

            <div className={`flex gap-2 my-1`}>
                <TextInput
                    id="name"
                    className="w-full"
                    ref={nameInput}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Username"
                />

                <PrimaryButton disabled={name.length === 0} onClick={selectUser}>{buttonText}</PrimaryButton>
            </div>

            <InputError message={nameError} className="my-2"/>
        </div>
    );
}

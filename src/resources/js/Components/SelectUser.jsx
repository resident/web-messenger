import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import InputError from "@/Components/InputError.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import {useRef, useState} from "react";

export default function SelectUser({onUserSelected}) {
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
            <InputLabel htmlFor="name" value="User Name"/>

            <TextInput
                id="name"
                ref={nameInput}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="mt-1 block w-full mb-2"
            />

            <InputError message={nameError} className="my-2"/>

            <PrimaryButton disabled={name.length === 0} onClick={selectUser}>+</PrimaryButton>
        </div>
    )
}

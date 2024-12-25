import InputLabel from "@/Components/InputLabel.jsx";
import TextInput from "@/Components/TextInput.jsx";
import InputError from "@/Components/InputError.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import {useEffect, useRef, useState} from "react";

export default function SelectUser({label = 'User Name', buttonText = 'Select', onUserSelected = user => null}) {
    const nameInput = useRef();
    const userRef = useRef(null);

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [showContacts, setShowContacts] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        axios.get(route('contact.contacts')).then(response => {
            setContacts(response.data);
        });
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (!userRef.current.contains(e.target)) {

                setShowContacts(false);
            }
        };

        if (showContacts) {
            document.addEventListener("click", handler);
        } else {
            document.removeEventListener("click", handler);
        }

        return () => document.removeEventListener("click", handler);
    }, [showContacts]);

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

    const selectContact = (e) => {
        const key = e.target.getAttribute('data-key');
        const contact = contacts[key];

        onUserSelected(contact);

        setShowContacts(false);
    };

    return (
        <div>
            <InputLabel className={`text-white`} htmlFor="name" value={label}/>

            <div className={`flex gap-2 my-1`}>
                <div className="relative w-full" ref={userRef}>
                    <TextInput
                        id="name"
                        className={`w-full ${showContacts && 'rounded-b-none'}`}
                        ref={nameInput}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => {
                            setIsFocused(true);
                            setShowContacts(contacts.length > 0);
                        }}
                        onBlur={() => setIsFocused(false)}
                        type="text"
                        placeholder="Username"
                    />

                    <div className={`
                        ${!showContacts && 'hidden'} ${isFocused && 'border-indigo-500 ring-indigo-500 ring-1'}
                        absolute w-full max-h-32 overflow-auto text-nowrap select-none cursor-pointer bg-white
                        border border-gray-300 border-t-0 rounded-b-md
                    `} onClick={selectContact}>
                        {contacts.map((contact, key) => (
                            <div key={key}
                                 data-key={key}
                                 className={`p-1 hover:bg-gray-100`}
                            >{contact.name}</div>
                        ))}
                    </div>
                </div>

                <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                               disabled={name.length === 0}
                               onClick={selectUser}>{buttonText}</PrimaryButton>
            </div>

            <InputError message={nameError} className="my-2"/>
        </div>
    );
}

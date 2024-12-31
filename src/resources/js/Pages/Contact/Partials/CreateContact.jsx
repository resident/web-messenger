import React, {useRef, useState} from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import axios from 'axios';
import InputError from '@/Components/InputError';

export default function CreateContact({auth, showModal, setShowModal, onAdded}) {
    const [error, setError] = useState(null);
    const userNameInput = useRef();

    const addContact = async (newContact) => {
        try {
            if (auth.user.name != newContact.contact_name || error) {
                await axios.post(route('contact.add'), newContact);
                onAdded(prev => !prev);
                setError('');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            setError(error.response.data.error)
        } finally {
            userNameInput.current.value = '';
        }
    };

    const reset = () => {
        setShowModal(false)
        userNameInput.current.value = '';
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addContact({contact_name: userNameInput.current.value});
    };

    return (
        <Modal show={showModal} onClose={() => reset()}>
            <form onSubmit={handleSubmit} className="p-6">
                <InputLabel htmlFor="contact_name" value="Contact Name"/>
                <TextInput
                    id="contact_name"
                    ref={userNameInput}
                    className="mt-1 block w-full"
                    isFocused
                    placeholder="Enter contact name"
                />
                <div className={`mt-6 flex ${error ? 'justify-between' : 'justify-end'}`}>
                    <InputError message={error}/>
                    <div className='flex'>
                        <PrimaryButton type="button"
                                       className="mr-3 !bg-blue-400 hover:!bg-blue-600"
                                       onClick={reset}
                        >Cancel</PrimaryButton>
                        <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                                       type="submit">Save</PrimaryButton>
                    </div>

                </div>
            </form>
        </Modal>
    );
}

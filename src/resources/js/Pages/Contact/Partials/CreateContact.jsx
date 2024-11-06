import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function CreateContact({ auth, showModal, setShowModal, onAdded }) {
    const [newContactName, setNewContactName] = useState('');

    const addContact = async (newContact) => {
        try {
            if(auth.user.name != newContact.contact_name ){
                await axios.post(route('contact.add'), newContact);
                onAdded(prev => !prev);
            }
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addContact({ contact_name: newContactName });
        setShowModal(false);
    };

    return (
        <Modal show={showModal} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="p-6">
                <InputLabel htmlFor="contact_name" value="Contact Name" />
                <TextInput
                    id="contact_name"
                    onChange={e => setNewContactName(e.target.value)}
                    className="mt-1 block w-full"
                    isFocused
                    placeholder="Enter contact name"
                />
                <div className="mt-6 flex justify-end">
                    <PrimaryButton type="button" onClick={() => setShowModal(false)} className="mr-3">Cancel</PrimaryButton>
                    <PrimaryButton type="submit">Save</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ContactPreview from './Partials/ContactPreview';
import PrimaryButton from '@/Components/PrimaryButton';
import CreateContact from './Partials/CreateContact';
import TextInput from '@/Components/TextInput';

export default function Contacts({ auth }) {
    const [contacts, setContacts] = useState([]);
    const [contactAdded, setContactAdded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get(route('contact.contacts'));
                setContacts(response.data);
                setShowModal(false);
            } catch (error) {
                console.error('Error fetching contacts:', error);
            }
        })()
    }, [contactAdded]);

    const handleDelete = (contactId) => {
        setContacts((prevContacts) => prevContacts.filter(contact => contact.id !== contactId));
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.includes(filterQuery)
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Contacts"
        >
            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg h-full overflow-y-auto">
                <div className="flex justify-end">
                    <PrimaryButton onClick={() => setShowModal(true)}>Add Contact</PrimaryButton>
                </div>

                <div className='my-2 sm:w-full md:w-2/4 lg:w-1/4'>
                    <TextInput
                        placeholder='Filter contacts'
                        className='w-full'
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)} />
                </div>


                <CreateContact
                    showModal={showModal}
                    setShowModal={setShowModal}
                    onAdded={setContactAdded}
                    auth={auth}
                />

                <div className="flex flex-col gap-4" >
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map(contact => (
                            <ContactPreview
                                key={contact.id}
                                contact={contact}
                                onDelete={handleDelete} />
                        ))
                    ) : (
                        <h3 className="text-left">No contacts</h3>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

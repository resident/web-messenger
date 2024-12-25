import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import ContactPreview from './Partials/ContactPreview';
import PrimaryButton from '@/Components/PrimaryButton';
import CreateContact from './Partials/CreateContact';
import TextInput from '@/Components/TextInput';

export default function Contacts({auth}) {
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
            <div className="bg-white shadow h-full overflow-y-auto">
                <div className={`grid md:grid-cols-2 h-full`}>
                    <div className={`p-3`}>
                        <PrimaryButton className={`!bg-blue-400 hover:!bg-blue-600`}
                                       onClick={() => setShowModal(true)}>Add Contact</PrimaryButton>

                        <div className="my-2">
                            <TextInput
                                placeholder='Filter contacts'
                                className="w-full"
                                value={filterQuery}
                                onChange={e => setFilterQuery(e.target.value)}/>
                        </div>

                        <CreateContact
                            showModal={showModal}
                            setShowModal={setShowModal}
                            onAdded={setContactAdded}
                            auth={auth}
                        />

                        <div className="flex flex-col">
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <ContactPreview
                                        key={contact.id}
                                        contact={contact}
                                        onDelete={handleDelete}/>
                                ))
                            ) : (
                                <h3 className="text-left">No contacts</h3>
                            )}
                        </div>
                    </div>

                    <div className={`bg-blue-300 hidden md:block`}></div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

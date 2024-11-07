<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Contact/Contacts');
    }

    public function getAllContacts(Request $request)
    {
        $user = $request->user();

        $contacts = $user->contacts()->with('avatar')->get();

        return response()->json($contacts);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $contactName = $request->input('contact_name');

        $contact = User::where('name', $contactName)->first();

        if (!$contact) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if (!$user->contacts()->where('contact_id', $contact->id)->exists()) {
            $user->contacts()->attach($contact->id);
            return response()->json(['success' => 'Contact added successfully']);
        }

        return response()->json(['error' => 'User is already a contact'], 404);
    }

    public function delete(Request $request)
    {
        $user = $request->user();
        $contactId = $request->input('contact_id');

        if ($user->contacts()->where('contact_id', $contactId)->exists()) {
            $user->contacts()->detach($contactId);
            return response()->json(['success' => 'Contact removed successfully']);
        }

        return response()->json(['error' => 'Contact not found'], 404);
    }
}

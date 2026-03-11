package com.example.complaint_management.services;

import com.example.complaint_management.model.Complaint;
import com.example.complaint_management.model.User;
import com.example.complaint_management.repo.CompRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompServices {

    @Autowired
    private CompRepo repo;

    public Complaint saveComplaints(Complaint complaint) {
        complaint.setStatus("OPEN");
        complaint.setCreatedAt(LocalDateTime.now());
        return repo.save(complaint);

    }

    public Complaint getComplaintById(Integer id) {
        return repo.findById(id).orElse(new Complaint());
    }

    public List<Complaint> getAllComplaints() {
        return repo.findAll();
    }

    public List<Complaint> getComplaintByUserId(Integer userId) {
        return repo.findByUserId(userId);
    }

    public Complaint updateComplaint(Integer id, Complaint complaint) {
        // Ensure the entity exists before trying to save
        return repo.findById(id)
                .map(existingComplaint -> {
                    // Only update if the Postman value isn't null
                    if (complaint.getDescription() != null) {
                        existingComplaint.setDescription(complaint.getDescription());
                    }
                    if (complaint.getStatus() != null) {
                        existingComplaint.setStatus(complaint.getStatus());
                    }
                    if (complaint.getUser() != null) {
                        existingComplaint.setUser(complaint.getUser());
                    }

                    return repo.save(existingComplaint);
                }).orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
    }

    public String deleteComplaint(Integer id) {
        repo.deleteById(id);
        return "Deleted";
    }

    public String deleteByStatus(String status) {
        int deletedCount = repo.deleteByStatus(status);
        if (deletedCount > 0) {
            return deletedCount + " complaints with status '" + status + "' were deleted.";
        } else {
            return "No complaints found with status '" + status + "'.";
        }
    }
}
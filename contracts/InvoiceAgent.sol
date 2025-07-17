// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InvoiceAgent is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    uint256 public feePercentage = 200; // 2% fee (basis points)
    uint256 public nextInvoiceId;

    struct Milestone {
        string name;
        uint256 amount;
        bool completed;
        uint256 completedAt;
    }

    struct Invoice {
        address freelancer;
        address client;
        uint256 totalAmount;
        Milestone[] milestones;
        bool paid;
        uint256 createdAt;
        string projectDescription;
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public userInvoices; // Track invoices by user

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed freelancer,
        address indexed client,
        uint256 totalAmount,
        string projectDescription
    );
    event MilestoneCompleted(
        uint256 indexed invoiceId,
        uint256 milestoneIndex,
        string milestoneName,
        uint256 amount
    );
    event PaymentReleased(
        uint256 indexed invoiceId,
        address indexed freelancer,
        uint256 amount,
        uint256 fee
    );
    event FeeCollected(uint256 indexed invoiceId, uint256 fee);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function createInvoice(
        address _freelancer,
        uint256 _totalAmount,
        string[] calldata _milestoneNames,
        uint256[] calldata _milestoneAmounts,
        string calldata _projectDescription
    ) external nonReentrant {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_milestoneNames.length > 0, "At least one milestone required");
        require(_milestoneNames.length == _milestoneAmounts.length, "Arrays length mismatch");
        require(_totalAmount > 0, "Amount must be greater than 0");

        uint256 sum = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            sum += _milestoneAmounts[i];
        }
        require(sum == _totalAmount, "Milestones must sum to total");

        // Client approves USDC transfer for total amount
        require(
            usdc.transferFrom(msg.sender, address(this), _totalAmount),
            "USDC transfer failed"
        );

        Invoice storage newInvoice = invoices[nextInvoiceId];
        newInvoice.freelancer = _freelancer;
        newInvoice.client = msg.sender;
        newInvoice.totalAmount = _totalAmount;
        newInvoice.projectDescription = _projectDescription;
        newInvoice.createdAt = block.timestamp;

        for (uint256 i = 0; i < _milestoneNames.length; i++) {
            newInvoice.milestones.push(
                Milestone({
                    name: _milestoneNames[i],
                    amount: _milestoneAmounts[i],
                    completed: false,
                    completedAt: 0
                })
            );
        }

        userInvoices[_freelancer].push(nextInvoiceId);
        userInvoices[msg.sender].push(nextInvoiceId);

        emit InvoiceCreated(
            nextInvoiceId,
            _freelancer,
            msg.sender,
            _totalAmount,
            _projectDescription
        );

        nextInvoiceId++;
    }

    function completeMilestone(uint256 _invoiceId, uint256 _milestoneIndex)
        external
        nonReentrant
    {
        Invoice storage inv = invoices[_invoiceId];
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        require(
            msg.sender == inv.client || msg.sender == owner(),
            "Only client or agent can complete milestone"
        );
        require(_milestoneIndex < inv.milestones.length, "Invalid milestone index");
        require(!inv.milestones[_milestoneIndex].completed, "Milestone already completed");

        Milestone storage milestone = inv.milestones[_milestoneIndex];
        milestone.completed = true;
        milestone.completedAt = block.timestamp;

        uint256 amount = milestone.amount;
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 payout = amount - fee;

        require(usdc.transfer(inv.freelancer, payout), "Freelancer payment failed");
        require(usdc.transfer(owner(), fee), "Fee collection failed");

        emit MilestoneCompleted(_invoiceId, _milestoneIndex, milestone.name, amount);
        emit PaymentReleased(_invoiceId, inv.freelancer, payout, fee);
        emit FeeCollected(_invoiceId, fee);

        // Check if all milestones are completed
        bool allComplete = true;
        for (uint256 i = 0; i < inv.milestones.length; i++) {
            if (!inv.milestones[i].completed) {
                allComplete = false;
                break;
            }
        }
        if (allComplete) {
            inv.paid = true;
        }
    }

    function getInvoice(uint256 _invoiceId)
        external
        view
        returns (
            address freelancer,
            address client,
            uint256 totalAmount,
            Milestone[] memory milestones,
            bool paid,
            uint256 createdAt,
            string memory projectDescription
        )
    {
        Invoice storage inv = invoices[_invoiceId];
        return (
            inv.freelancer,
            inv.client,
            inv.totalAmount,
            inv.milestones,
            inv.paid,
            inv.createdAt,
            inv.projectDescription
        );
    }

    function getUserInvoices(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userInvoices[_user];
    }

    function getInvoiceCount() external view returns (uint256) {
        return nextInvoiceId;
    }

    // Improved getter functions for better frontend integration
    function getMilestoneAmounts(uint256 _invoiceId) external view returns (uint256[] memory) {
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        Invoice storage inv = invoices[_invoiceId];
        uint256[] memory amounts = new uint256[](inv.milestones.length);
        for (uint256 i = 0; i < inv.milestones.length; i++) {
            amounts[i] = inv.milestones[i].amount;
        }
        return amounts;
    }

    function getMilestoneCompleted(uint256 _invoiceId) external view returns (bool[] memory) {
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        Invoice storage inv = invoices[_invoiceId];
        bool[] memory completed = new bool[](inv.milestones.length);
        for (uint256 i = 0; i < inv.milestones.length; i++) {
            completed[i] = inv.milestones[i].completed;
        }
        return completed;
    }

    function getMilestoneDetails(uint256 _invoiceId, uint256 _milestoneIndex)
        external
        view
        returns (string memory name, uint256 amount, bool completed, uint256 completedAt)
    {
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        require(_milestoneIndex < invoices[_invoiceId].milestones.length, "Invalid milestone index");
        Milestone storage milestone = invoices[_invoiceId].milestones[_milestoneIndex];
        return (milestone.name, milestone.amount, milestone.completed, milestone.completedAt);
    }

    function getMilestoneCount(uint256 _invoiceId) external view returns (uint256) {
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        return invoices[_invoiceId].milestones.length;
    }

    function updateFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 500, "Fee cannot exceed 5%");
        feePercentage = _newFeePercentage;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(usdc.transfer(owner(), balance), "Fee withdrawal failed");
    }

    // Emergency function to refund client if needed
    function emergencyRefund(uint256 _invoiceId) external onlyOwner {
        Invoice storage inv = invoices[_invoiceId];
        require(_invoiceId < nextInvoiceId, "Invoice does not exist");
        require(!inv.paid, "Invoice already paid");

        uint256 refundAmount = 0;
        for (uint256 i = 0; i < inv.milestones.length; i++) {
            if (!inv.milestones[i].completed) {
                refundAmount += inv.milestones[i].amount;
            }
        }

        if (refundAmount > 0) {
            require(usdc.transfer(inv.client, refundAmount), "Refund failed");
        }
    }
} 